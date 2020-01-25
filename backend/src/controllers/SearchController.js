const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');

const maxDistanceInMeters = 10000;

module.exports = {
    async index(req, resp) {
        const filter = buildFilter(req.query);
        const devs = await Dev.find(filter).collation({ locale: 'en' }).sort('name');

        return resp.json(devs);
    }
};

function buildFilter(fields) {
    const { latitude, longitude, techs } = fields;

    let techsFilter;
    let distanceFilter;

    if (techs) {
        const techsArray = parseStringAsArray(techs);
        techsFilter = { $in: techsArray };
    }

    if (latitude && longitude) {
        distanceFilter = {
            $near: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: maxDistanceInMeters
            }
        };
    }

    if (techsFilter && distanceFilter) {
        return { techs: techsFilter, location: distanceFilter }
    } else if (techsFilter) {
        return { techs: techsFilter }
    } else if (distanceFilter) {
        return { location: distanceFilter }
    }
}