exports.formatCurrency = (currencyCode,value) => {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: currencyCode||"NGN",
    }).format(+value);
};
