const setFormDefaults = () => {
    // Run this in browser so we automatically get tz-specific data
    const dateDefaultValue = new Date().getFullYear() + "-" + (new Date().getMonth()+1).toString().padStart(2, "0") + "-" + new Date().getDate();
    const timeDefaultValue = new Date().getHours() + ":" + new Date().getMinutes();

    document.querySelector("form input[type='date']").min = dateDefaultValue;
    document.querySelector("form input[type='date']").value = dateDefaultValue;

    document.querySelector("form input[type='time']").min = timeDefaultValue;
    document.querySelector("form input[type='time']").value = timeDefaultValue;
};

export { setFormDefaults };