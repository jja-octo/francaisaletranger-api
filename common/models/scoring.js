'use strict';
var loopback = require('loopback');
function matchingScoring(savedNeeder, foundHelperList) {
    const preparedHelperList = foundHelperList.map((foundHelper) => {
        const neederLocation = new loopback.GeoPoint(savedNeeder.gps_coordinates);
        var helperLocation = new loopback.GeoPoint(foundHelper.gps_coordinates);

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

            return { score, total };
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
            distanceInMeters: neederLocation.distanceTo(helperLocation, {
                type: 'meters',
            }),
        };
    });

    return preparedHelperList
        .sort((a, b) => {
            // on trie par distance
            return a.distanceInMeters - b.distanceInMeters;
        })
        .map((helper, index) => {
            let addToScrore = 1;

            // si la distance actuelle est la même que la précédente, on ajoute le même score
            if (index !== 0 && preparedHelperList[index - 1].distanceInMeters === helper.distanceInMeters) {
                addToScrore = 1 - ((index - 1) / preparedHelperList.length);
            } else {
                // sinon on calcule un prorata par rapport au nombre total de demande d'aide en fonction de la position dans la liste
                addToScrore = 1 - (index / preparedHelperList.length);
            }

            helper.scoring = helper.criteresMatching.score + Math.round(addToScrore * 100) / 100;

            return helper;
        });
}

module.exports.matchingScoring = matchingScoring