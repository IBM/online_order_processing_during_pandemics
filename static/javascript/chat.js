const chatBody = $('.ChatWindow');
var itr = 0;
var flag = false;
var exec = 0;

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

function addToDB() {
    msgas = chatBody.find('div.ChatItem--customer').find('div.ChatItem-chatContent').find('div.ChatItem-chatText').last().html();

    responseList = msgas.split(',');
    respoName = responseList[1].split('.')[0].trim();
    respoContact = responseList[1].split(' with')[0].split('is ')[1];
    respAddress = msgas.split('to ')[1].split('.')[0];
    respOrder1 = msgas.split('as ')[1].split(' &amp;')[0]

    addDatabaseContents(respoName, respoContact, respOrder1, respAddress);
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
                if (data.message == "Okay. Enter the product name and quantity together as comma-separated values.") {
                    bringUpForm.click();
                }

                if (data.message == "What is your address?") {
                    getLocation();
                }

                if (data.message.substring(0, 6) == "Thanks") {
                    addToDB();
                }

                itr = itr + 1;

            } else {

                chatBody.find('div.ChatItem--customer').last().remove();
                $('.ChatWindow').append(
                    '<div class="ChatItem ChatItem--customer"> <div class="ChatItem-meta"> <div class="ChatItem-avatar"> <img class="ChatItem-avatarImage" src="static/watson.png"> </div> </div> <div class="ChatItem-chatContent"> <div class="ChatItem-chatText">' + data.message + '</div> <div class="ChatItem-timeStamp"><strong>Watson Chatbot</strong></div> </div> </div>');

                if (data.message == "Okay. Enter the product name and quantity together as comma-separated values.") {
                    bringUpForm.click();
                }

                if (data.message == "What is your address?") {
                    getLocation();
                }

                if (data.message.substring(0, 6) == "Thanks") {
                    addToDB();
                }

                itr = itr + 1;
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

async function addDatabaseContents(respoName, respoContact, respOrder1, respAddress) {

    let orderDetails = {
        name: respoName,
        phone: respoContact,
        orders: respOrder1,
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
    $requestData.html(option.toString());
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
        optionsSelected(selectedFromTemplate);

    }, 1000);
});