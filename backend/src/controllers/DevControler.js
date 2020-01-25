const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
    async index(req, resp) {
        const devs = await Dev.find();
        
        return resp.json(devs);
    },

    async store(req, resp) {
        const { github_username, techs, latitude, longitude } = req.body;
        const techsArray = parseStringAsArray(techs);

        let dev = await Dev.findOne({ github_username });

        if (dev)
            return resp.status(400).json({ message: "Dev already exists." });
            
        const devInfo = await getDevInfo(req.body);
        dev = await Dev.create(devInfo);

        updateClient({ latitude, longitude }, techsArray, dev);

        return resp.status(201).json(dev);
    },

    async update(req, resp) {
        const { github_username, techs, latitude, longitude } = req.body;

        const devExist = await Dev.exists({ github_username });

        if (!devExist)
            return resp.status(400).json({ message: "Dev does not exists." });

        const dev = await Dev.findOneAndUpdate({ github_username }, { techs, latitude, longitude }, {
            new: true
        });

        return resp.json(dev);
    },

    async delete(req, resp) {
        const { github_username } = req.query;

        const devExist = await Dev.exists({ github_username });

        if (!devExist)
            return resp.status(400).json({ message: "Dev does not exists." });

        await Dev.deleteOne({ github_username });

        return resp.status(204);
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
    const sendSocketMessageTo = findConnections(coordinates, techs);
    sendMessage(sendSocketMessageTo, 'new-dev', dev);
}