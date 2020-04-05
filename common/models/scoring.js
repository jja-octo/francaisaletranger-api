'use strict';

function matchingScoring(savedNeeder, foundHelperList, idsAndDistances) {
  const distance = {}
  idsAndDistances.forEach(tuple => distance[tuple.id] = tuple.distanceinmeters)
  const preparedHelperList = foundHelperList.map((foundHelper) => {

    function criteresMatching(foundHelper) {
      let score = 0;
      let total = 0;

      if (savedNeeder.nombre_hebergement > 0) {
        score += (foundHelper.nombre_hebergement >= savedNeeder.nombre_hebergement) ? 1 : 0;
        total += 1;
      }
      if (savedNeeder.approvisionnement) {
        score += (savedNeeder.approvisionnement === foundHelper.approvisionnement) ? 1 : 0;
        total += 1;
      }
      if (savedNeeder.autres) {
        score += (savedNeeder.autres === foundHelper.autres) ? 1 : 0;
        total += 1;
      }
      if (savedNeeder.conseils) {
        score += (savedNeeder.conseils === foundHelper.conseils) ? 1 : 0;
        total += 1;
      }

      return {score, total};
    }

    return {
      id: foundHelper.id,
      nom: foundHelper.nom,
      prenom: foundHelper.prenom,
      nombre_hebergement: foundHelper.nombre_hebergement,
      approvisionnement: foundHelper.approvisionnement,
      conseils: foundHelper.conseils,
      autres: foundHelper.autres,
      criteresMatching: criteresMatching(foundHelper),
      distanceInMeters: distance[foundHelper.id],
    };
  });

  return preparedHelperList
    .sort((a, b) => {
      // we sort by distance
      return a.distanceInMeters - b.distanceInMeters;
    })
    .map((helper, index) => {
      let addToScore;

      // if the current distance is the same as the previous one, we add the same score
      if (index !== 0 && preparedHelperList[index - 1].distanceInMeters === helper.distanceInMeters) {
        addToScore = 1 - ((index - 1) / preparedHelperList.length);
      } else {
        // otherwise we calculate a pro rata in relation to the total number of aid requests according to the position in the list
        addToScore = 1 - (index / preparedHelperList.length);
      }

      helper.scoring = helper.criteresMatching.score + Math.round(addToScore * 100) / 100;

      return helper;
    })
    .sort((a, b) => {
      return b.scoring - a.scoring;
    });
}

module.exports.matchingScoring = matchingScoring
