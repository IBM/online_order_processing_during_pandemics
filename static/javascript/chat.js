const chatBody = $('.ChatWindow');
var itr = 0;
var flag = false;
var exec = 0;

var phone = "1112223333";
var address = "104, Bhagyanagar, Belgaum";
var nameM = "Manoj";
var order1 = "black gram 2 kgs";
var order3 = "Dettol 2 bottles";
var order2 = "flour 1 kgs";

var lat;
var lon;

var selectedFromTemplate = [];

const bringUpForm = document.getElementById('bringUpForm');

$(document).ready(function() {

    initWatsonAssistant();

    if (flag == true)
        setTimeout(function() { run(); }, 5000);

    $("#myform").on("submit", function(event) {
        event.preventDefault();
        watson();
    });

});


(function() {
    var $ChatInput;
    $ChatInput = $('.ChatInput-input');
    $ChatInput.keyup(function(e) {
        var $this;
        if (e.shiftKey && e.which === 13) {
            e.preventDefault();
            return false;
        }
        $this = $(this);
        if (e.which === 13) {
            watson();
        }
    });

}).call(this);

function runBatch(itr, msg) {

    $requestData = $('.ChatInput-input');

    if (itr == 1) {
        $requestData.html(order1);
        watson();
    }
    if (itr == 2) {
        $requestData.html(order2);
        watson();
    }
    if (itr == 3) {
        $requestData.html(order3);
        watson();
    }
    if (itr == 4) {
        $requestData.html(address);
        watson();
    }
    if (itr == 5) {
        $requestData.html(nameM);
        watson();
    }
    if (itr == 6) {
        $requestData.html(phone);
        watson();
    }
    if (itr == 7) {

    }
}

function addToDB() {
    msgas = chatBody.find('div.ChatItem--customer').find('div.ChatItem-chatContent').find('div.ChatItem-chatText').last().html();

    responseList = msgas.split(',');
    respoName = responseList[1].split('.')[0];
    respoContact = responseList[1].split(' with')[0].split('is ')[1];
    respOrder1 = responseList[1].split('as ')[1];
    respOrder2 = responseList[2];
    respOrder3 = responseList[3].split(' &')[0];
    respAddress = msgas.split('to ')[1].split('.')[0];

    addDatabaseContents(respoName, respoContact, respOrder1, respOrder2, respOrder3, respAddress);
}

async function watson() {
    var $ChatInput;
    $ChatInput = $('.ChatInput-input');
    newText = $ChatInput.html();
    formData = newText.split('<')[0];
    $ChatInput.html('');

    $('.ChatWindow').append(
        '<div class="ChatItem ChatItem--expert"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/user.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText">' + newText + '</div> <div class="ChatItem-timeStamp"><strong>Customer</strong></div> </div> </div>');

    $('.ChatWindow').append(
        '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText"><label class="bx--label bx--skeleton"></label></div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>');

    await $.ajax({
        url: '/getWatsonAssistantResponse',
        method: 'get',
        data: { msg: formData },
        dataType: 'json',
        success: function(data) {
            if (data.response_type == "option") {
                chatBody.find('div.ChatItem--customer').last().remove();
                $('.ChatWindow').append(
                    '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText">' + data.message + '</div> <div class="ChatItem-chatText"><ul class="here"> </ul> </div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>');

                data.options.forEach(element => {
                    chatBody.find('div.ChatItem--customer').find('div.ChatItem-chatContent').find('div.ChatItem-chatText').find('ul.here').last().append(
                        '<li>' + element.label + '</li>'
                    );
                });
                itr = itr + 1;

                if (itr == 1) {
                    bringUpForm.click();
                }

                if (flag == true)
                    setTimeout(
                        function() {
                            runBatch(itr, data.message);
                        }, 1000);

            } else {

                chatBody.find('div.ChatItem--customer').last().remove();
                $('.ChatWindow').append(
                    '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText">' + data.message + '</div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>');

                itr = itr + 1;

                if (flag == true)
                    setTimeout(
                        function() {
                            runBatch(itr, data.message);
                        }, 1000);


                if (itr == 4) {
                    // get Location co-ordinates
                    getLocation();
                    // make api call to get acurate location
                    // show a prompt displaying address and asking for confirmation
                    // if user says yes send the location to the watson()
                    // if user says no send no send blank text to watson()
                }
                if (itr == 7)
                    addToDB();
            }
        }
    });
    $('.ChatWindow').animate({
        scrollTop: $('.ChatWindow').prop("scrollHeight")
    }, 500);

    return 1;
}

function run() {
    $requestData = $('.ChatInput-input');
    $requestData.html('place an order');
    watson();
}

function simulateKey(keyCode, type, modifiers) {
    var evtName = (typeof(type) === "string") ? "key" + type : "keydown";
    var modifier = (typeof(modifiers) === "object") ? modifier : {};

    var event = document.createEvent("HTMLEvents");
    event.initEvent(evtName, true, false);
    event.keyCode = keyCode;

    for (var i in modifiers) {
        event[i] = modifiers[i];
    }

    document.dispatchEvent(event);
}

async function initWatsonAssistant() {
    $.ajax({
        url: '/getWatsonAssistantResponse',
        method: 'get',
        data: { msg: '' },
        dataType: 'json',
        success: function(data) {
            if (data.response_type == "option") {
                chatBody.find('div.ChatItem--customer').last().remove();
                $('.ChatWindow').append(
                    '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText">' + data.message + '</div> <div class="here"> </div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>');

                data.options.forEach(element => {
                    chatBody.find('div.ChatItem--customer').find('div.ChatItem-chatContent').find('div.here').last().append(
                        `<a class="bx--tag bx--tag--teal" onclick="optionsSelected('${element.label}')"> <strong class= "bx--tag__label">${element.label}</strong> </a>`
                    );
                });

            } else {

                chatBody.find('div.ChatItem--customer').last().remove();
                $('.ChatWindow').append(
                    '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText">' + data.message + '</div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>');

            }
        }
    });
}

function automate(nam, pho, ord1, ord2, ord3, add) {
    phone = pho;
    address = add;
    nameM = nam;
    order1 = ord1;
    order3 = ord2;
    order2 = ord3;
    flag = true;
    run();
}

async function addDatabaseContents(respoName, respoContact, respOrder1, respOrder2, respOrder3, respAddress) {

    let orderDetails = {
        name: respoName,
        phone: respoContact,
        orders: respOrder1 + ' ' + respOrder2 + ' ' + respOrder3,
        address: respAddress,
    };

    let formData = new FormData();
    formData.append("orderDetails", JSON.stringify(orderDetails));

    $.ajax({
        url: '/addDatabaseContents',
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function(response) {

            var mydata = response;

            if (mydata.flag == 'success')
                console.log('added to db2!');
            else
                console.log('something went wrong...');
        }
    });
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successFunction);
    } else {
        alert('It seems like Geolocation, which is required for this page, is not enabled in your browser. Please use a browser which supports it.');
    }
}

function successFunction(position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    getStreetLevelLocation(lat, lon);
    console.log('Your latitude is :' + lat + ' and longitude is ' + lon);
}

async function getStreetLevelLocation(lat, lon) {
    await fetch(`/getlocation?lat=${lat}&lon=${lon}`).then(async(response) => {
        data = await response.json();

        chatBody.find('div.ChatItem--customer').last().remove();
        $('.ChatWindow').append(
            '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText"> Looks like your address is: </div> <div class="ChatItem-chatText"><ul class="here"> </ul> </div> <div class="here"> </div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>'
        );
        chatBody.find('div.ChatItem--customer').find('div.ChatItem-chatContent').find('div.ChatItem-chatText').find('ul.here').last().append(
            '<li> "' + data.place + '" </li>'
        );
        chatBody.find('div.ChatItem--customer').find('div.ChatItem-chatContent').find('div.here').last().append(
            `<a class="bx--tag bx--tag--teal" onclick="locationConfirm(0, '${data.place}')"> <strong class= "bx--tag__label">Yes proceed with the address</strong> </a>`
        );
        chatBody.find('div.ChatItem--customer').find('div.ChatItem-chatContent').find('div.here').last().append(
            `<a class="bx--tag bx--tag--teal" onclick="locationConfirm(1, 'no')"> <strong class= "bx--tag__label">No I will enter my address</strong> </a>`
        );
        $('.ChatWindow').animate({
            scrollTop: $('.ChatWindow').prop("scrollHeight")
        }, 500);
    });
}

function optionsSelected(option) {
    $requestData = $('.ChatInput-input');
    $requestData.html(option);
    exec = exec + watson();
    return exec
}

function locationConfirm(flag, address) {
    if (flag == 0) {
        $requestData = $('.ChatInput-input');
        $requestData.html(address);
        watson();
    } else {
        chatBody.find('div.ChatItem--customer').last().remove();
        $('.ChatWindow').append(
            '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText"> Enter your Address? </div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>');

        $('.ChatWindow').animate({
            scrollTop: $('.ChatWindow').prop("scrollHeight")
        }, 500);
    }
}

$('#modalAction').on('click', function() {
    setTimeout(function() {

        $.each($("input[name='template']:checked"), function() {
            selectedFromTemplate.push($(this).val());
        });

        for (i = 0; i < selectedFromTemplate.length; i++) {
            product = selectedFromTemplate[i].toLowerCase();
            quantity = document.getElementById(`${product}-qty`).value;
            if (product == 'dettol') {
                if (quantity > 1)
                    selectedFromTemplate[i] = product + ' ' + quantity + ' bottles';
                else
                    selectedFromTemplate[i] = product + ' ' + quantity + ' bottle';
            } else {
                if (quantity > 1)
                    selectedFromTemplate[i] = product + ' ' + quantity + ' kgs';
                else
                    selectedFromTemplate[i] = product + ' ' + quantity + ' kg';
            }
        }

        if (selectedFromTemplate.length == 2) {
            optionsSelected(selectedFromTemplate[0]);
            setTimeout(() => optionsSelected(selectedFromTemplate[1]), 2000);
        } else if (selectedFromTemplate.length > 2) {
            optionsSelected(selectedFromTemplate[0]);
            setTimeout(() => optionsSelected(selectedFromTemplate[1]), 2000);
            setTimeout(() => optionsSelected(selectedFromTemplate[2]), 4000);
        } else if (selectedFromTemplate.length == 1) {
            optionsSelected(selectedFromTemplate[0]);
        } else {}

    }, 1000);
});

$('#iosAcceptButton').on('click', function() {
    setTimeout(function() {

        $.each($("input[name='template']:checked"), function() {
            selectedFromTemplate.push($(this).val());
        });

        for (i = 0; i < selectedFromTemplate.length; i++) {
            product = selectedFromTemplate[i].toLowerCase();
            quantity = document.getElementById(`${product}-qty`).value;
            if (product == 'dettol') {
                if (quantity > 1)
                    selectedFromTemplate[i] = product + ' ' + quantity + ' bottles';
                else
                    selectedFromTemplate[i] = product + ' ' + quantity + ' bottle';
            } else {
                if (quantity > 1)
                    selectedFromTemplate[i] = product + ' ' + quantity + ' kgs';
                else
                    selectedFromTemplate[i] = product + ' ' + quantity + ' kg';
            }
        }

        if (selectedFromTemplate.length == 2) {
            optionsSelected(selectedFromTemplate[0]);
            setTimeout(() => optionsSelected(selectedFromTemplate[1]), 2000);
        } else if (selectedFromTemplate.length > 2) {
            optionsSelected(selectedFromTemplate[0]);
            setTimeout(() => optionsSelected(selectedFromTemplate[1]), 2000);
            setTimeout(() => optionsSelected(selectedFromTemplate[2]), 4000);
        } else if (selectedFromTemplate.length == 1) {
            optionsSelected(selectedFromTemplate[0]);
        } else {}

    }, 1000);
});