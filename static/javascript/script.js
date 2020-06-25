const table = document.getElementById("table");
const tableRef = table.getElementsByTagName('tbody')[0];

$(document).ready(function() {
    getDatabaseContents();
});

var addSerialNumber = function() {
    $('table tr').each(function(index) {
        $(this).find('td:nth-child(1)').html(index);
    });
};

async function getDatabaseContents() {
    await fetch('/getDatabaseContents').then(async(response) => {
        $("table").find("tr:gt(0)").remove();
        data = await response.json();

        data.forEach(element => {
            var row = table.insertRow(1);

            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);

            cell1.innerHTML = "";
            cell2.innerHTML = element.NAME;
            cell3.innerHTML = element.PHONE;
            cell4.innerHTML = element.ORDERS;
            cell5.innerHTML = element.ADDRESS;

            addSerialNumber();
        });
    });
}