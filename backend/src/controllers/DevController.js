const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
    async index(req, resp) {
        const devs = await Dev.find().collation({ locale: 'en' }).sort('name');
        
        return resp.json(devs);
    },

    async store(req, resp) {
        const { github_username, techs, latitude, longitude } = req.body;

        if (!github_username)
            return resp.status(400).json({ message: 'Field github_username cannot be empty.' });
        if (!techs)
            return resp.status(400).json({ message: 'Field techs cannot be empty.' });

        let dev = await Dev.findOne({ github_username });
        if (dev)
            return resp.status(400).json({ message: 'Dev already exists.' });
        
        let devInfo;
        try {
            devInfo = await getDevInfo(req.body);
        } catch(err) {
            return resp.status(400).json({ message: `User ${github_username} not found on Github.` });
        }

        dev = await Dev.create(devInfo);
        updateClient({ latitude, longitude }, techs, dev);

        return resp.status(201).json(devInfo);
    },

    async update(req, resp) {
        const { github_username, techs, latitude, longitude } = req.body;

        if (!github_username)
            return resp.status(400).json({ message: 'Field github_username cannot be empty.' });
        if (!techs)
            return resp.status(400).json({ message: 'Field techs cannot be empty.' });

        const devExist = await Dev.exists({ github_username });

        if (!devExist)
            return resp.status(400).json({ message: 'Dev does not exists.' });

        const dev = await Dev.findOneAndUpdate({ github_username }, { techs, latitude, longitude }, {
            new: true
        });

        return resp.json(dev);
    },

    async delete(req, resp) {
        const { github_username } = req.params;

        const devExist = await Dev.exists({ github_username });

        if (!devExist)
            return resp.status(400).json({ message: 'Dev does not exists.' });

        await Dev.deleteOne({ github_username });

        return resp.status(204).json();
    }
};

async function getDevInfo(body) {
    const { github_username, techs, latitude, longitude } = body;
    const techsArray = parseStringAsArray(techs);

    const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
        
    const { name = login, avatar_url, bio } = apiResponse.data;

    const devInfo = {
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location: { type: 'Point', coordinates: [longitude, latitude] }
    }

    return devInfo;
}

function updateClient(coordinates, techs, dev) {
    const sendSocketMessageTo = findConnections(coordinates, parseStringAsArray(techs));
    sendMessage(sendSocketMessageTo, 'new-dev', dev);
}