var UrlaubsApp = UrlaubsApp || (function () {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    var indexedDB = window.indexedDB;

    var db = "testdb";
    var store = null;
    var openType = "readwrite";

    /*
     * names
     */
    var dbname = "urlaubsAppDB";
    var storeName = "artikel";
    var version = 3;

    var init = function () {
        checkIndexedDB();
        createDB();
    };

    var checkIndexedDB = function () {
        if (!window.indexedDB) {
            window.alert("Ihr Browser unterstützt kein IndexedDB. Daten können nicht offline gespeichert werden.");
        }
    };

    var createDB = function () {
        var request = indexedDB.open(dbname, version);
        request.onsuccess = function (event) {
            db = event.target.result;
            getArtikel();
            setEventHandler();
//            insertIntoDB();
        };

        request.onerror = function (event) {
            console.log("Es gab einen Fehler beim Öffnen der Datenbank. Sie müssen ihre Privacy Settings ändern.");
        };

        request.onupgradeneeded = function (event) {
            db = event.target.result;
            /*
             * set the store variable
             */
            store = db.createObjectStore("artikel", {
                keyPath: 'id', autoIncrement: true
            });
            store.createIndex('name', 'name', {unique: false});
            store.createIndex('menge', 'menge', {unique: false});
            store.createIndex('typ', 'typ', {unique: false});
            store.createIndex('aktiv', 'aktiv', {unique: false});
            console.log("Upgrade wurde ausgeführt");
        };

    };

    var getArtikel = function () {
        /*
         * Remove the former artikel
         */
        $(".list-group-item").remove();
        var artikel = [];
        var request = indexedDB.open(dbname, version);
        request.onsuccess = function (event) {
            var db = event.target.result;
            var store = db.transaction(['artikel'], "readonly").objectStore('artikel');
            var range = IDBKeyRange.lowerBound(0);
            var cursorRequest = store.openCursor(range);
            cursorRequest.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    var value = cursor.value;
                    var art = {
                        id: cursor.key,
                        name: cursor.value.name,
                        menge: cursor.value.menge,
                        typ: cursor.value.typ,
                        aktiv: cursor.value.aktiv
                    };
                    artikel.push(art);
                    displayArtikel(art);
                    cursor.continue();
                } else {
                    //done
                }
            };
        };
    };

    var removeArtikel = function (id) {
        var request = indexedDB.open(dbname, version);
        request.onsuccess = function (event) {
            var db = event.target.result;
            var store = db.transaction(['artikel'], 'readwrite').objectStore('artikel');
            store.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {

                    if (cursor.key == id) {
                        cursor.delete();
                        getArtikel();
                    }
                    cursor.continue();
                }
            };
        };
    };
    
    var toggleArtikel = function(id){
        var request = indexedDB.open(dbname, version);
        request.onsuccess = function (event) {
            var db = event.target.result;
            var store = db.transaction(['artikel'], 'readwrite').objectStore('artikel');
            store.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (cursor.key == id) {
                        var art = {
                            id: cursor.key,
                            name: cursor.value.name,
                            menge: cursor.value.menge,
                            typ: cursor.value.typ,
                            aktiv: cursor.value.aktiv
                        };
                        art.aktiv = (art.aktiv == 1) ? 0 : 1;
                        cursor.update(art);
                        getArtikel();
                    }
                    cursor.continue();
                }
            };
        };
    };

    var setEventHandler = function () {
        $("#addArtikel").click(function () {
            $("#insertForm").toggle(500);
        });
        
        $("#button_add_artikel").click(function(){
            var art = {
                name: $.trim($("#input_artikel_name").val()),
                menge: $.trim($("#input_artikel_menge").val()),
                typ: $.trim($("#input_artikel_typ").val()),
                akiv: '0'
            };
            insertIntoDB(art);
        });
    };

    var displayArtikel = function (art) {
        var $listItem = $('<li class="list-group-item"></li>');
        var divstr = '<div class="artikel_zeile" id="artikel_' + art.id + '" >';
        divstr += '<div class="row">';
        divstr += '<div class="col-xs-8">';
//        divstr += '<div class="artikel_nummer">Nummer:' + art.id + '</div>';
        divstr += '<div class="artikel_name">' + art.name + '</div>';
        divstr += '<div class="artikel_menge">Menge: ' + art.menge + '</div>';
        divstr += '<div class="artikel_typ"><span class="badge">' + art.typ + '</span></div>';
        divstr += '</div>';
        divstr += '<div class="col-xs-4">';
        divstr += '<div class="btn-group" role="group" aria-label="Aktionen">';
        divstr += '<button type="button" class="artikel_delete btn btn-default"><span class="glyphicon glyphicon-trash"></span></button>';
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
        $div.find(".artikel_delete").click(function (event) {
            var idAttr = $(this).parents(".artikel_zeile").attr("id");
            var artikel_id = idAttr.split("_")[1];
            removeArtikel(artikel_id);

        });
        $div.find(".artikel_set").click(function (event) {
            var idAttr = $(this).parents(".artikel_zeile").attr("id");
            var artikel_id = idAttr.split("_")[1];
            toggleArtikel(artikel_id);

        });
        $listItem.append($div);
        $("#Liste").append($listItem);
    };

    var insertIntoDB = function (art) {
        var request = indexedDB.open(dbname, version);
        request.onsuccess = function (event) {
            var db = event.target.result;
            var store = db.transaction(['artikel'], "readwrite").objectStore('artikel');
            var insertRequest = store.add(art);
            insertRequest.onsuccess = function (event) {
                getArtikel();
            };
        };
    };

    return {
        "init": init
    };
})();


UrlaubsApp.init();