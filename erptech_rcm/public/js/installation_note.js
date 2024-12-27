frappe.ui.form.on('Installation Note', {
    refresh: async function (frm) {
        if (frm.doc.items[0] && frm.doc.items[0].prevdoc_docname) {
            InstallationCount = await frappe.db.count('Installation Note')
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Delivery Note",
                    name: frm.doc.items[0].prevdoc_docname
                },
                callback: async function (res) {
                    if (res.message) {
                        let bom = await frappe.db.get_value('BOM', res.message.items[0].custom_bom_no, 'custom_recipe_code')
                        frm.set_value('inst_time', res.message.posting_time);
                        frm.set_value('custom_vehicle_no', res.message.custom_vehicle);
                        frm.set_value('custom_driver_name', res.message.driver);
                        frm.set_value('custom_recipe_name', res.message.items[0].item_code);
                        frm.doc.items[0]['custom_bom_no'] = res.message.items[0].custom_bom_no
                        frm.doc.items[0]['custom_recipe_code'] = bom.message.custom_recipe_code
                        frm.doc.items[0]['custom_sales_order_no'] = res.message.items[0].against_sales_order
                        frm.doc.items[0]['custom_count'] = Number(frm.doc.items[0]['qty'] / frm.doc.items[0]['custom_batch_size']).toFixed(0)
                        frm.doc.items[0]['custom_percycle'] = frm.doc.items[0]['qty'] / frm.doc.items[0]['custom_count']
                        let customNoOfBatch = frm.doc.items[0]['qty'] / frm.doc.items[0]['custom_percycle']
                        frm.doc.items[0]['custom_no_of_batch'] = customNoOfBatch
                        frm.refresh_field('items');
                        if (res.message.items[0].custom_bom_no) {
                            frappe.call({
                                method: "frappe.client.get",
                                args: {
                                    doctype: "BOM",
                                    name: res.message.items[0].custom_bom_no
                                },
                                callback: function (res) {
                                    frm.doc.custom_installation_note_recipe = []
                                    res.message.custom_items_2.forEach((item) => {
                                        let custom_installation_note_recipe = frm.add_child("custom_installation_note_recipe");
                                        custom_installation_note_recipe.item_code = item.item_code;
                                        custom_installation_note_recipe.item_name = item.item_name;
                                        custom_installation_note_recipe.qty = item.qty;
                                        custom_installation_note_recipe.rate = item.rate;
                                        custom_installation_note_recipe.uom = item.uom;
                                        custom_installation_note_recipe.amount = item.amount;
                                        custom_installation_note_recipe.source_warehouse = item.source_warehouse;
                                    });
                                    frm.refresh_field('custom_installation_note_recipe');

                                    // Generate Data
                                    frm.doc.custom_data = []
                                    frm.doc.custom_installation_note_data_total = []
                                    res.message.custom_items_2.forEach((item) => {
                                        let tar = 0
                                        let act = 0
                                        for (let i = 1; i <= customNoOfBatch; i++) {
                                            let custom_data = frm.add_child("custom_data");
                                            custom_data.batch_no = InstallationCount + 1
                                            custom_data.item = item.item_code;
                                            custom_data.tar = item.qty;
                                            tar = tar + Number(item.qty)
                                            const diffVal = Math.floor(Math.random() * (6 + 5 + 1)) - 5;
                                            custom_data.act = Number(item.qty) + diffVal;
                                            act = act + Number(item.qty) + diffVal
                                        }
                                        let custom_installation_note_data_total = frm.add_child("custom_installation_note_data_total");
                                        custom_installation_note_data_total.batch_no = InstallationCount + 1
                                        custom_installation_note_data_total.item = item.item_code;
                                        custom_installation_note_data_total.tar = tar
                                        custom_installation_note_data_total.act = act
                                    })
                                    frm.refresh_field('custom_data');
                                    frm.refresh_field('custom_installation_note_data_total');
                                }
                            });
                        }
                    }
                }
            });
        }
    },
})