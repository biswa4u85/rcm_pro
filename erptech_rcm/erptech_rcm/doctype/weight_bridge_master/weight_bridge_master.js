// Copyright (c) 2024, erptech and contributors
// For license information, please see license.txt

frappe.ui.form.on("Weight Bridge Master", {
    async refresh(frm) {
        doc = await frappe.db.get_doc('RCM Settings', 'enable_weigh_scale')
        if (doc.enable_weigh_scale == 1) {
            if ("serial" in navigator) {
                var ports = await navigator.serial.getPorts();
                if (ports.length == 0) {
                    frappe.confirm(
                        'Please provide permission to connect to the weigh device',
                        async function () {
                            let port = await navigator.serial.requestPort();
                            await port.open({ baudRate: Number(doc.baud_rate) });
                            await listenToPort(port, doc);
                        },

                    );
                } else {
                    await ports[0].open({ baudRate: Number(doc.baud_rate) });
                    await listenToPort(ports[0], doc);
                }
            }
            else {
                frappe.msgprint("Your browser does not support serial device connection. Please switch to a supported browser to connect to your weigh device");
            }

        }
    }
});

async function listenToPort(port, settings) {
    console.log('port', port, settings)

    const outputDiv = document.querySelector('input[data-fieldname="display_data"]');
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    // Listen to data coming from the serial device.
    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            reader.releaseLock();
            break;
        }
        // value is a string.
        outputDiv.value = value
        console.log(value);
    }
}