(function () {
    'use strict';

var $jq = {
        app: $('#starWarsExtensionCustom'),

        mainTitle: $('#mainTitle'),
        detailsTitle: $('#detailsTitle'),
        startPage: $('#startPage'),
        startPageRow: $('#startPage .row'),
        mainPaginator: $('#paginator'),

        breadcrumbs: $('#breadcrumbs'),

        characterDetails: $('#characterDetails'),
        goToMain: $('#goToMain'),

        detailsPage: $('#detailsPage'),
        detailsPageRow: $('#detailsPage .detailsWrapper'),
        paginatorDetails: $('#paginatorDetails')
    },
    methods = {
        startWaitAnimation: function () {
            $jq.app.addClass("loading");
        },
        stopWaitAnimation: function () {
            $jq.app.removeClass("loading");
        }
    },
    startPage = {
        nextPage: false,
        pageId: 1,
        currentPage: 1,
        getList: function (url = 'http://swapi.co/api/people/') {$.getJSON(url, startPage.buildStartPage);},
        buildStartPage: function (response) {
            characters.totalCount = response.count;
            startPage.nextPage = response.next;
            response.results.map(function (character) {
                if (!characters.loadedCharacters[character.name]) {
                    startPage.addToCharactersData(character);
                }
            });
            startPage.createPagination();
        },
        addToCharactersData: function (character) {
            let characterName = character.name + '_' + startPage.pageId;
            characters.loadedCharacters[character.name] = characterName;
            characters.filmsCharacters[character.url] = characterName;
            characters.characters[characterName] = character;
            characters.charactersCounter++;
            if (5 === characters.charactersCounter) {
                characters.charactersCounter = 1;
                startPage.pageId++;
            }

            return characterName;
        },
        createPagination: function () {
            $jq.mainPaginator.twbsPagination('destroy');
            $jq.mainPaginator.twbsPagination({
                startPage: startPage.currentPage,
                totalPages: Math.ceil(characters.totalCount / 4),
                visiblePages: 4,
                prev: '<<',
                next: '>>',
                first: '',
                last: '',
                onPageClick: function (event, page) {
                    let pagesCount = Object.keys(characters.characters).map(function (num) { return num.split('_').pop()}),
                        countPages = _.countBy(pagesCount)[page];
                    startPage.currentPage = page;
                    $jq.startPageRow.html('');
                    if ((!countPages || countPages < 4) && (page * 4 <= characters.totalCount)) {
                        startPage.getList(startPage.nextPage);
                    } else {
                        $.map(characters.characters, function (character) {
                            let properIdName = character.name + '_' + page;
                            if (characters.characters[properIdName]) {
                                if (!characters.characters[properIdName].fixed_width_small || !characters.characters[properIdName].fixed_width_downsampled) {
                                    characters.getGiphy(character).then(function (giphy) {
                                        characters.addGiphy(giphy, character, properIdName);
                                        startPage.addToCurrentPage(character);
                                    });
                                } else {
                                    startPage.addToCurrentPage(character);
                                }
                            }
                        });
                    }
                }
            });
        },
        addToCurrentPage: function (character, $selector = $jq.startPageRow) {
            $selector.append(`
                <div class="col-xs-6 well swTile characterName" data-name="${character.name}">
                    <a class="thumbnail">
                        <img src="${character.fixed_width_small}" alt="${character.name}" height="120">
                    </a>
                    <div><a href="#" >${character.name}</a></div>
                </div>
            `);
        },
        handler: function () {
            $jq.startPageRow.on('click', '.characterName', characters.characterDetails);
            $jq.goToMain.click(function () {
                $jq.startPage.show();
                $jq.mainTitle.show();
                $jq.characterDetails.hide();
                $jq.breadcrumbs.hide();
                $jq.detailsTitle.hide();
            });
        }
    },
    characters = {
        data: false,
        characters: {},
        loadedCharacters: {},
        charactersCounter: 1,
        totalCount: false,
        filmsCharacters: {},
        getGiphy: function (character) {
            return $.ajax({
                url: `http://api.giphy.com/v1/gifs/translate?s=${character.name.toLowerCase().split(' ').join('_')}&api_key=dc6zaTOxFJmzC`,
                type: 'json',
                method: 'GET'
            });
        },
        addGiphy: function (giphy, character, properIdName) {
            let fixed_width_small = 'https://media1.giphy.com/media/840BecqExNMhq/100w.gif',
                fixed_width_downsampled = 'https://media1.giphy.com/media/840BecqExNMhq/200w_d.gif';
            if (!Array.isArray(giphy.data)) {
				fixed_width_small = giphy.data.images.fixed_width_small.url;
				fixed_width_downsampled = giphy.data.images.fixed_width_downsampled.url;
			}
            if (!characters.characters[properIdName].fixed_width_small) {
                characters.characters[properIdName].fixed_width_small = fixed_width_small;
            }
            if (!characters.characters[properIdName].fixed_width_downsampled) {
                characters.characters[properIdName].fixed_width_downsampled = fixed_width_downsampled;
            }
        },
        getDetails: function (urls, name, selector, objToSave) {
            let result = '',
                detailName = '';
            $('#' + selector).html('');
            switch(selector) {
                case 'films':
                    result = 'filmsResult';
                    detailName = 'title';
                    break;
                case 'vehicles':
                    result = 'vehiclesResult';
                    detailName = 'name';
            }
            if (!characters.characters[name][result] && urls.length) {
                characters.characters[name][result] = [];
                urls.map(function (url) {
                    $.getJSON(url, function (response) {
                        characters.characters[name][result].push(response[detailName]);
                        objToSave[response[detailName]] = response;
                        characters.addToDOM(response[detailName], selector);
                    });
                });
            } else {
                if (urls.length) {
                    characters.addToDOM(characters.characters[name][result], selector);
                }
            }
        },
        addToDOM: function (list, selector) {
			let icon = 'film';
			if ('vehicles' === selector) {
				icon = 'plane';
			}
            if (Array.isArray(list)) {
                list.map(function (item) {
                    $('#' + selector).append(`<div> <span class="glyphicon glyphicon-${icon}" aria-hidden="true">&nbsp</span><a href="#" class="${selector}" data-name="${item}" data-category="${selector}">${item}</a></div>`);});
            } else {
                $('#' + selector).append(`<div> <span class="glyphicon glyphicon-${icon}" aria-hidden="true">&nbsp</span><a href="#" class="${selector}" data-name="${list}" data-category="${selector}">${list}</a></div>`);
            }
        },
        getSpecies: function (url, name) {
            if (!characters.characters[name].speciesResult) {
                $.getJSON(url, function (response) {
                    characters.characters[name].speciesResult = response.name;
                    $('#species').html(`species: ${response.name}`);
                });
            } else {
                $('#species').html(`species: ${characters.characters[name].speciesResult}`);
            }
        },
        characterDetails: function () {
            let name = $(this).attr('data-name'),
				  nameId = characters.loadedCharacters[name],
                  character = characters.characters[characters.loadedCharacters[name]];
            if (character) {
                $jq.startPage.hide();
                $jq.mainTitle.hide();
                $jq.breadcrumbs.find('.crumb').html(character.nameId).end().show();
				$jq.detailsPageRow.html('');
				$jq.characterDetails.hide();
				$jq.detailsPage.hide();
                films.pageId = 1;
                $jq.characterDetails.html(`
                    <div class="col-xs-6">
                        <div class="row well text-left">
                            <div class="col-xs-12" id="species"></div>
                            <div class="col-xs-12">height: ${character.height}</div>
                            <div class="col-xs-12">mass: ${character.mass}</div>
                            <div class="col-xs-12">hair_color: ${character.hair_color}</div>
                            <div class="col-xs-12">skin_color: ${character.skin_color}</div>
                            <div class="col-xs-12">birth_year: ${character.birth_year}</div>
                            <div class="col-xs-12">gender: ${character.gender}</div>
                            <div class="col-xs-12"><div><b>Films</b></div><div id="films"></div></div>
                            <div class="col-xs-12"><div><b>Vehicles</b></div><div id="vehicles"></div></div>
                        </div>
                    </div>
                    <div class="col-xs-6 well"><a class="thumbnail">
                        <img src="${character.fixed_width_downsampled}" alt="${character.name}">
                    </a></div>
                `
                );
                characters.getSpecies(character.species, nameId);
                characters.getDetails(character.films, nameId, 'films', films);
                characters.getDetails(character.vehicles, nameId, 'vehicles', vehicles);
                $jq.characterDetails.show();
            }
        },
        handler: function () {
            $jq.characterDetails.on('click', '.films', films.getFilmsDetails);
            $jq.characterDetails.on('click', '.vehicles', vehicles.getVehiclesDetails);
        }
    },
    details = {
        detailsToggle: function (name) {
            $jq.detailsPageRow.html('');
            $jq.characterDetails.hide();
            $jq.breadcrumbs.hide();
            $jq.detailsTitle.html(name).show();
        },
        giphyWrapper: function (characterObj, filmName, characterName, dataName) {
            characters.getGiphy(characterObj).then(function (giphy) {
                characters.addGiphy(giphy, characterObj, characterName);
                details.appendToPage(characterName, filmName, dataName);
            });
        },
        appendToPage: function (name, obj, dataName) {
            if (!$jq.detailsPageRow.find('#detailsPage_' + films.pageId).length) {
                details.createPageDiv();
            }
            if (characters.characters[name]) {
                var $pageId = $('#detailsPage_' + films.pageId).find('.swTile');
                if ($pageId.length === 4) {
                    films.pageId++;
                    details.createPageDiv();
                    startPage.addToCurrentPage(characters.characters[name], $('#detailsPage_' + films.pageId));
                    details.paginator(obj[dataName].length);
                }
                if ($pageId.length < 4) {
                    startPage.addToCurrentPage(characters.characters[name], $('#detailsPage_' + films.pageId));

                }
                if (obj[dataName].length < 4) {
                    details.paginator(obj[dataName].length);
                }
            }
        },
        createPageDiv: function () {
            $jq.detailsPageRow.append(`<div id="detailsPage_${films.pageId}" class="detailsPage"></div>`);
        },
        pageId: 1,
        paginator: function (total) {
            $jq.paginatorDetails.twbsPagination('destroy');
            $jq.paginatorDetails.twbsPagination({
                startPage: 1,
                totalPages: Math.ceil(total / 4),
                visiblePages: 4,
                prev: '<<',
                next: '>>',
                first: '',
                last: '',
                onPageClick: function (event, page) {
                    $jq.detailsPageRow.find('.detailsPage').hide();
                    $jq.detailsPageRow.find('#detailsPage_' + page).show();
                }
            });
        },
        handler: function () {
            $jq.detailsPage.on('click', '.characterName', characters.characterDetails);
        }
    },
    films = {
        getFilmsDetails: function () {
            var name = $(this).attr('data-name');
            if (films[name] && films[name].characters) {
                var filmsCharacters = films[name].characters;
                details.detailsToggle(name);
                filmsCharacters.map(function (url) {
                    if (characters.filmsCharacters[url]) {
                        var characterObj = characters.characters[characters.filmsCharacters[url]];
                        if (!characterObj.fixed_width_small || !characterObj.fixed_width_downsampled) {
                            details.giphyWrapper(characterObj, films[name], characters.filmsCharacters[url], 'characters');
                        } else {
                            details.appendToPage(characters.filmsCharacters[url], films[name], 'characters');
                        }
                    } else {
                        $.getJSON(url, function (character) {
                            var characterName = startPage.addToCharactersData(character);
                            details.giphyWrapper(characters.characters[characterName], films[name], characterName, 'characters');
                        });
                    }
                });
                $jq.detailsPage.show();
            }
        }
    },
    vehicles = {
        getVehiclesDetails: function () {
			var name = $(this).attr('data-name');
            if (vehicles[name] && vehicles[name].pilots) {
                var vehiclesCharacters = vehicles[name].pilots;
                details.detailsToggle(name);
                vehiclesCharacters.map(function (url) {
                    if (characters.filmsCharacters[url]) {
                        var characterObj = characters.characters[characters.filmsCharacters[url]];
                        if (!characterObj.fixed_width_small || !characterObj.fixed_width_downsampled) {
                            details.giphyWrapper(characterObj, vehicles[name], characters.filmsCharacters[url], 'pilots');
                        } else {
                            details.appendToPage(characters.filmsCharacters[url], vehicles[name], 'pilots');
                        }
                    } else {
                        $.getJSON(url, function (character) {
                            var characterName = startPage.addToCharactersData(character);
                            details.giphyWrapper(characters.characters[characterName], vehicles[name], characterName, 'pilots');
                        });
                    }
                });
                $jq.detailsPage.show();
            }
		},
	};
    startPage.handler();
    characters.handler();
    details.handler();
    startPage.getList();
	$('#volumeUp').click(function () {document.getElementById('music').play();});
	$('#volumeOff').click(function () {document.getElementById('music').pause();});
    $(document).on({
        ajaxStart: methods.startWaitAnimation,
        ajaxStop: methods.stopWaitAnimation
    });
}());