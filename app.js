/**
 * возвращает коллекцию данных из таблицы
  * @returns {Array}
 */
var getData = function () {

    return $('table tr')  //найти все строки таблицы,вернет массив jquery
            .toArray()   //массив jquery -> массив
            .map(function(b){   //переобразовать массив(каждая строка измениться на точто возвращает функция)
                var el = $(b);

                return {
                    id: el.find('td:nth-child(1) p').text(),
                    uid: el.find('td:nth-child(2) p').text(),
                    district: el.find('td:nth-child(3) p').text(),
                    rayon: el.find('td:nth-child(4) p').text(),
                    address: el.find('td:nth-child(5) p').text(),
                    coordinates: null
                };
            });

};

/**
 * получить координаты по адресу
 * @param item
 * @returns {Promise<item>}
 */
var getCoordinates = function (item ) {
    var adresFull = 'район '+ item.rayon + ', ' + item.address;
    //создается промис,который должен возвратить координаты пришедшие с сервера яндекса
    var myGeocoder = ymaps.geocode(adresFull);

    //возвращаем промис,с данными с обновленными координатами
    return new Promise(function(resolve, reject){
        myGeocoder.then(
            function (res) {
                var coordinate = res.geoObjects.get(0).geometry.getCoordinates();
                //console.log(coordinate);
                item.coordinates = coordinate;
                resolve(item);
            },
            function (err) {
                console.log('abort');
                reject(err);
            });
    });


};

/**
 * проверка адреса
 * @param name
 * @returns {boolean}
 */
isNameValid = function (name) {
    var valid = true;

    switch(true){
        case name === '':
        case !name:
        case name == 'Адрес места сбора':
        case name == 'OBJECTID':
        case typeof name !== 'string':
            valid = false;
            break;
    }
    return valid;
};


/**
 * когда загрузится библиотьека яндексапи
 */
ymaps.ready(function () {
    //получить массив адресов из колонки
    var data = getData();

    //массив промисов
    var promices = [];

    data.forEach(function (item) {

        if( isNameValid(item.address) ){
            //в массив попадет ссылка на промис,тоесть выполнение скрипта пойдет дальше,а не будет ждать пока с сервера придут данные
            promices.push(
                getCoordinates(item)
            );
        }else{
            console.log('%c'+'не валидное имя для ','color: rgb(238, 141, 102);', item.id, 'адресс:',item.address );
        }

    });

    //дождемся пока все запросы на сервер придут
    Promise.all(promices)
        //если все хорошо
        .then(function (items) {
            //создаем вируальный узел DOM
            var fragment = document.createDocumentFragment();
            var tbody = document.getElementsByTagName('tbody')[0];
            var table = tbody.parentNode;

            //пройтись по каждойстроке таблицы
            $('table tr').each(function (i, item) {
                    //находим id данных в этой строке
                    var rowEl = $(item);
                    var id = rowEl.find('td:nth-child(1) p').text();
                    //console.log('id',id);

                    //создаем шаблон,который потом будем заполнять данными
                    var tmp = _.template('<tr class="ro1">' +
                        '<td style="text-align:right; width:14.82mm; " class="ce1"><p><%= id %></p></td>' +
                        '<td style="text-align:left;width:14.82mm; " class="ce1"><p><%= uid %></p></td>' +
                        '<td style="text-align:left;width:22.15mm; " class="ce1"><p><%= district %></p></td>' +
                        '<td style="text-align:left;width:64.56mm; " class="ce1"><p><%= rayon %></p></td>' +
                        '<td style="text-align:left;width:165.45mm; " class="ce1"><p><%= address %></p></td>' +
                        '<td style="text-align:left;width:22.15mm; " class="ce1">&nbsp;</td>' +
                        '<td style="text-align:left;width:22.15mm; " class="Default">&nbsp;</td>' +
                        '<td style="text-align:left;width:26.11mm; " class="ce7"><p><%= coordinates[0] %></p></td>' +
                        '<td style="text-align:left;width:23.99mm; " class="ce7"><p><%= coordinates[1] %></p></td>' +
                        '<td style="text-align:left;width:22.15mm; " class="Default">&nbsp;</td></tr>');

                    if(isNameValid(id)){
                        //находим по id данные для этой строки
                        var data = _.find(items, {id: id});

                        //пихаем в виртуальный кусок DOM наш шаблон(tmp) и запоолняем его данными(data)
                        fragment.appendChild(
                            //эта конструкция превращает текстовый шаблон в DOM элемент
                            $(tmp(data))[0]
                        );
                    }else{
                        fragment.appendChild(
                            $(tmp({
                                id: 'не опердилилася',
                                uid: 'не опердилилася',
                                district: 'не опердилилася',
                                rayon: 'не опердилилася',
                                address: 'не опердилилася',
                                coordinates: 'не опердилилася'
                            }))[0]
                        );
                    }
            });
            
            //тупо меняем старую таблицу на новую
            table.removeChild(tbody);
            table.appendChild(fragment);
        })
        //если не все запросы завершились удачно
        .catch(function (err) {
            console.log('%c'+'ошибка для ', item.id, 'адресс:',item.address,'color: rgb(238, 141, 102);');
        })


});

