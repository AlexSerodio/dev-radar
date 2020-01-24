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
        techs = parseStringAsArray(techs);

        let dev = await Dev.findOne({ github_username });

        if (dev)
            return resp.status(400).json({ message: "Dev already exists." });
            
        const devInfo = getDevInfo(github_username, techs);
        dev = await Dev.create(devInfo);

        updateClient({ latitude, longitude }, techs, dev);

        return resp.status(201).json(dev);
    }
};

function getDevInfo(github_username, techs) {
    const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
        
    const { name = login, avatar_url, bio } = apiResponse.data;

    const devInfo = {
        github_username,
        name,
        avatar_url,
        bio,
        techs,
        location: { type: 'Point', coordinates: [longitude, latitude] }
    }

    return devInfo;
}

function updateClient(coordinates, techs, dev) {
    const sendSocketMessageTo = findConnections(coordinates, techs);
    sendMessage(sendSocketMessageTo, 'new-dev', dev);
}