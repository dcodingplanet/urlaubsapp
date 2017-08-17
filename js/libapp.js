var UrlaubsApp = UrlaubsApp || (function () {
    var server;
    var artikelNotAktivFilterOn = false;
    var typFilterOn = false;
    var currentTyp = "";
    var currentLogoTransform = 0;


    var init = function () {
        setEventHandler();
        getKategorien();
        getArtikelDueToSetFilter();
    };

    var setServer = function () {
        return db.open({
            server: 'dcp',
            version: 2,
            schema: {
                artikel: {
                    key: {keyPath: 'aid', autoIncrement: true},
                    indexes: {
                    }
                },
                kategorie: {
                    key: {keyPath: 'kid', autoIncrement: true},
                    indexes: {
                    }
                }
            }
        }).then(function (s) {
            server = s;
        });
    };

    /**
     * Insert a new Kategorie with the form {bezeichnung}
     * @param {object} kategorie
     * @returns {void}
     */
    var insertKategorie = function (kategorie) {
        setServer().then(function (r) {
            server.kategorie.add(kategorie).then(function (item) {
                getKategorien();
            });
        });
    };

    var getKategorien = function () {
        setServer().then(function (r) {
            server.kategorie.query().all().execute().then(function (results) {
                $("#input_artikel_typ option").remove();
                results = results.sort(sortByName);
                results.forEach(function (kategorie) {
                    var kat = $.trim(kategorie.name);
                    $("<option>").val(kat).text(kat).appendTo($("#input_artikel_typ"));
                });
            });
        });
    };

    var sortByName = function (a, b) {
        var aName = a.name.toLowerCase();
        var bName = b.name.toLowerCase();
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    };

    var sortByTyp = function (a, b) {
        var aTyp = a.typ.toLowerCase();
        var bTyp = b.typ.toLowerCase();
        return ((aTyp < bTyp) ? -1 : ((aTyp > bTyp) ? 1 : 0));
    };

    var countArtikel = function () {
        return setServer().then(function (r) {
            server.artikel.count();
        });
    };

    var getArtikel = function () {
        setServer().then(function (r) {
            server.artikel.query().all().execute().then(function (results) {
                $(".list-group-item").remove();
                /*
                 * sort by name, then by typ
                 */
                results = results.sort(sortByName);
                results = results.sort(sortByTyp);
                results.forEach(function (art) {
                    displayArtikel(art);
                });
            });
        });
    };

    var getArtikelByTyp = function (typ) {
        typ = $.trim(typ);
        setServer().then(function (r) {
            /*
             * Only get not active Artikel if the artikelNotAktivFilter is set
             */
            if (artikelNotAktivFilterOn && typ == "") {
                server.artikel.query().filter('aktiv', 0).execute().then(function (results) {
                    $(".list-group-item").remove();
                    /*
                     * sort by name, then by typ
                     */
                    results = results.sort(sortByName);
                    results = results.sort(sortByTyp);
                    results.forEach(function (art) {
                        displayArtikel(art);
                    });
                });
            } else if (!artikelNotAktivFilterOn && typ == "") {
                server.artikel.query().all().execute().then(function (results) {
                    $(".list-group-item").remove();
                    /*
                     * sort by name, then by typ
                     */
                    results = results.sort(sortByName);
                    results = results.sort(sortByTyp);
                    results.forEach(function (art) {
                        displayArtikel(art);
                    });
                });
            } else if (artikelNotAktivFilterOn && typ != "") {
                server.artikel.query().filter('aktiv', 0).filter('typ', typ).execute().then(function (results) {
                    $(".list-group-item").remove();
                    /*
                     * sort by name, then by typ
                     */
                    results = results.sort(sortByName);
                    results = results.sort(sortByTyp);
                    results.forEach(function (art) {
                        displayArtikel(art);
                    });
                });
            } else if (!artikelNotAktivFilterOn && typ != "") {
                server.artikel.query().filter('typ', typ).execute().then(function (results) {
                    $(".list-group-item").remove();
                    /*
                     * sort by name, then by typ
                     */
                    results = results.sort(sortByName);
                    results = results.sort(sortByTyp);
                    results.forEach(function (art) {
                        displayArtikel(art);
                    });
                });
            }

        });
    };

    var getUncheckedArtikelByTyp = function (typ) {
        typ = $.trim(typ);
        setServer().then(function (r) {
            server.artikel.query().filter('typ', typ).filter('aktiv', 0).execute().then(function (results) {
                $(".list-group-item").remove();
                /*
                 * sort by name, then by typ
                 */
                results = results.sort(sortByName);
                results = results.sort(sortByTyp);
                results.forEach(function (art) {
                    displayArtikel(art);
                });
            });
        });
    };

    var getUncheckedArtikel = function () {
        setServer().then(function (r) {
            server.artikel.query().filter('aktiv', 0).execute().then(function (results) {
                $(".list-group-item").remove();
                /*
                 * sort by name, then by typ
                 */
                results = results.sort(sortByName);
                results = results.sort(sortByTyp);
                results.forEach(function (art) {
                    displayArtikel(art);
                });
            });
        });
    };

    /**
     * Insert an Artikel of the form {name, menge, typ, aktiv}
     * @param {Object} art
     * @returns {void}
     */
    var insertArtikel = function (art) {
        setServer().then(function () {
            server.artikel.add(art).then(function (item) {
                getArtikelDueToSetFilter(currentTyp);
            });
        });
    };

    var removeArtikel = function (id) {
        setServer().then(function () {
            server.artikel.remove(parseInt(id)).then(function (item) {
                getArtikelDueToSetFilter(currentTyp);
            });
        });
    };

    var toggleArtikel = function (id) {
        setServer().then(function () {
            server.artikel.get(id).then(function (item) {
                item.aktiv = (item.aktiv == 1) ? 0 : 1;
                server.artikel.update(item).then(function () {
                    getArtikelDueToSetFilter(currentTyp);
                });
            });
        });
    };

    var setEventHandler = function () {
        $("#addArtikel").click(function (e) {
            $(".context-forms").hide(0);
            $("#insertForm").toggle(500);
        });

        $("#addKategorie").click(function (e) {
            $(".context-forms").hide(0);
            $("#insertKategorieForm").toggle(500);
        });

        $(".navbar-toggle").click(function () {
            $(".context-forms").hide(0);
        });

        $("#app-info-button").click(function () {
            $(".context-forms").hide(0);
//            $(".navbar-header button").click();
            $("#app-info-dialog").show(500);
            $("#button_info_close").click(function () {
                $("#app-info-dialog").hide(500);
            });
        });

        $("#button_add_artikel").click(function () {
            var artikelName = $.trim($("#input_artikel_name").val());
            var artikelMenge = $.trim($("#input_artikel_menge").val());
            var artikelTyp = $.trim($("#input_artikel_typ").val());
            if (artikelName == "" || artikelMenge == "" || artikelTyp == "") {
                console.error("Error", "The name ofthe Artikel, the Menge of the Artikel or the Typ of the Artikel is empty.");
                return;
            }
            var art = {
                name: $.trim($("#input_artikel_name").val()),
                menge: $.trim($("#input_artikel_menge").val()),
                typ: $.trim($("#input_artikel_typ").val()),
                aktiv: '0'
            };
            $("#insertForm").toggle(0);
            insertArtikel(art);
        });

        $("#button_add_kategorie").click(function () {
            var kategorieName = $.trim($("#input_kategorie_name").val());
            if (kategorieName == "") {
                console.error("Error", "The name of the Kategorie is empty.");
                return;
            }
            var kategorie = {
                name: $.trim($("#input_kategorie_name").val())
            };
            $("#insertKategorieForm").toggle(0);
            insertKategorie(kategorie);
        });

        $("#showArtikelAktiv").click(function () {
            //deactivate the typFilter
            typFilterOn = false;
            $(".context-forms").hide(0);
            var $span = $(this).find("span");
            var artikelNotActiveClass = "glyphicon-briefcase";
            var artikelAllClass = "glyphicon-eye-open";
            if ($span.hasClass(artikelNotActiveClass)) {
                artikelNotAktivFilterOn = true;
                $span.removeClass(artikelNotActiveClass);
                $span.addClass(artikelAllClass);
                getArtikelDueToSetFilter(currentTyp);
            } else {
                artikelNotAktivFilterOn = false;
                $span.removeClass(artikelAllClass);
                $span.addClass(artikelNotActiveClass);
                getArtikelDueToSetFilter(currentTyp);
            }
        });
        
        $("#app-logo").click(function(){
            if(currentLogoTransform == 360){
                currentLogoTransform = 0;
            }
            currentLogoTransform = currentLogoTransform + 45;
            $("#app-logo img").css("transform", "rotate(" + currentLogoTransform + "deg)");
        });
    };

    var displayArtikel = function (art) {
        var $listItem = $('<li class="list-group-item"></li>');
        var divstr = '<div class="artikel_zeile" id="artikel_' + art.aid + '" >';
        divstr += '<div class="row">';
        divstr += '<div class="col-xs-3">';
        divstr += '<button type="button" class="artikel_delete btn btn-default"><span class="glyphicon glyphicon-trash"></span></button>';
        divstr += '</div>';
        divstr += '<div class="col-xs-6">';
//        divstr += '<div class="artikel_nummer">Nummer:' + art.aid + '</div>';
        divstr += '<div class="artikel_name">' + art.name + '</div>';
        divstr += '<div class="artikel_menge">Menge: ' + art.menge + '</div>';
        divstr += '<div class="artikel_typ"><span class="badge typ-badge">' + art.typ + '</span></div>';
        divstr += '</div>';
        divstr += '<div class="col-xs-3">';
        divstr += '<div class="btn-group" role="group" aria-label="Aktionen">';
        if (art.aktiv == 1) {
            divstr += '<button type="button" class="artikel_set btn btn-success"><span class="glyphicon glyphicon-ok"></span></button>';
        } else {
            divstr += '<button type="button" class="artikel_set btn btn-default"><span class="glyphicon glyphicon-ok"></span></button>';
        }
        divstr += '</div>';
        divstr += '</div>';
        divstr += '</div>';
        divstr += '</div>';
        var $div = $(divstr);
        /*
         * Set the events dynamically after creating the node
         */
        $div.find(".artikel_delete").click(function (event) {
            var idAttr = $(this).parents(".artikel_zeile").attr("id");
            var artikel_id = idAttr.split("_")[1];
            removeArtikel(parseInt(artikel_id));

        });
        $div.find(".artikel_set").click(function (event) {
            var idAttr = $(this).parents(".artikel_zeile").attr("id");
            var artikel_id = idAttr.split("_")[1];
            toggleArtikel(parseInt(artikel_id));

        });

        $div.find(".typ-badge").click(function (event) {
            //Switch the typ filter
            typFilterOn = !typFilterOn;
            currentTyp = (typFilterOn) ? $.trim($(this).text()) : "";
            getArtikelDueToSetFilter(currentTyp);
        });

        $listItem.append($div);
        $("#Liste").append($listItem);
    };

    var getArtikelDueToSetFilter = function (typ) {
        getArtikelByTyp(typ);

    };

    return{
        init: init
    };
})();

UrlaubsApp.init();