'use strict';

module.exports = function (Needhelp) {
  Needhelp.matching = function (id, maxDistance, cb) {
    Needhelp.findOne({
      where: {
        id,
      },
    }, (err, needer) => {
      Needhelp.app.models.Helper.find({
        where: {
          gps_coordinates: {
            near: needer.gps_coordinates,
            maxDistance,
            unit: 'meters',
          },
        },
      }, (err, value) => cb(null, value));
    });
  };

  Needhelp.remoteMethod('matching', {
    accepts: [{
      arg: 'id',
      type: 'string',
    }, {
      arg: 'maxDistance',
      type: 'number',
    }],
    returns: {
      args: 'response',
      type: 'object',
    },
    http: {
      verb: 'get',
    },
  });
};
