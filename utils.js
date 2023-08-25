function strToDate(dateString) {
    var dateParts = dateString.split("/");

    // mês inicia com 0, por isso subtrair -1
    return new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0], 0,0,0,0); 
}

module.exports = {
    strToDate
}