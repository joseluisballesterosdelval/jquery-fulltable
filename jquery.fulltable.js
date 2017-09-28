/**
 * @description Inline editor for HTML tables compatible with Bootstrap
 * @version 1.0.0
 * @author José Luis Ballesteros del Val
 */

if (typeof jQuery === 'undefined') {
  throw new Error('FullTable requires jQuery library.');
}

(function($) {
    'use strict';

    $.fn.FullTable = function() {
        
		if (!this.is('table')) {
            return this;
        }
				
		var table = $(this);
				
		Object.defineProperty(table, "keys", {
			get:function() {
				if ($(table).data('fulltable-keys') == null) $(table).data('fulltable-keys', []);
				return $(table).data('fulltable-keys');
			},
			set:function(val) {
				$(table).data('fulltable-keys', val);
			}
		});
		
		Object.defineProperty(table, "rows", {
			get:function() {
				if ($(table).data('fulltable-rows') == null) $(table).data('fulltable-rows', []);
				return $(table).data('fulltable-rows');
			},
			set:function(val) {
				$(table).data('fulltable-rows', val);
			}
		});
		
		Object.defineProperty(table, "sorting", {
			get:function() {
				if ($(table).data('fulltable-sorting') == null) $(table).data('fulltable-sorting', []);
				return $(table).data('fulltable-sorting');
			},
			set:function(val) {
				$(table).data('fulltable-sorting', val);
			}
		});
		
		Object.defineProperty(table, "events", {
			get:function() {
				if ($(table).data('fulltable-events') == null) $(table).data('fulltable-events', {});
				return $(table).data('fulltable-events');
			},
			set:function(val) {
				$(table).data('fulltable-events', val);
			}
		});

		var types = {
			"integer":["integer", "number"],
			"decimal":["decimal", "float", "double"],
			"string":["string", "literal"]
		};
		
		var on = function() {
			return methods['on'].apply(this, arguments);
		};
		
		var clean = function() {
			return methods['clean'].apply(this, arguments);
		};
		
		var changeSettings = function() {
			return methods['changeSettings'].apply(this, arguments);
		};
		
		var drawHeader = function() {
			return methods['drawHeader'].apply(this, arguments);
		};
		
		var drawBody = function() {
			return methods['drawBody'].apply(this, arguments);
		};
		
		var draw = function() {
			return methods['draw'].apply(this, arguments);
		};

		var filter = function() {
			return methods['filter'].apply(this, arguments);
		};
		
		var order = function() {
			return methods['order'].apply(this, arguments);
		};

		var validateRow = function() {
			return methods['validateRow'].apply(this, arguments);
		};

		var addRow = function() {
			return methods['addRow'].apply(this, arguments);
		};

		var editRow = function() {
			return methods['editRow'].apply(this, arguments);
		};

		var removeRow = function() {
			return methods['removeRow'].apply(this, arguments);
		};
		
		var saveRow = function() {
			return methods['saveRow'].apply(this, arguments);
		};

		var discardRow = function() {
			return methods['discardRow'].apply(this, arguments);
		};
		
		var checkRow = function() {
			return methods['checkRow'].apply(this, arguments);
		};
		
		var addSortItem = function(fieldName, fieldSort) {
			var removing_indexes = [];
			for (var index in table.sorting) {
				var sortingItem = table.sorting[index];
				if (sortingItem.name == fieldName) {
					removing_indexes.push(index);
				}
			}
			removing_indexes = removing_indexes.reverse();
			for (var index in removing_indexes) {
				index = removing_indexes[index];
				table.sorting.splice(index, 1);
			}
			table.sorting.push({
				name: fieldName,
				sort: fieldSort
			});
		}
		
		var getHeaderFromDom = function() {
			// Init headers and field names.		
			$(table).find("thead th").each(function(th_index, th) {
				var fieldName = $(th).attr("fulltable-field-name");
				if (fieldName == null) {
					fieldName = (new Date()).getTime()+""+(Math.floor(Math.random()*1e8));
					$(th).attr("fulltable-field-name", fieldName);
				}
				table.keys[th_index] = fieldName;
			});
		};
		
		var drawRow = function(data, tr) {
			if (typeof data != "object") data = null;
			if (tr == null) {
				tr = $("<tr/>");
				for (var key in table.keys) {
					key = table.keys[key];
					var td = $("<td/>");
					$(td).attr("fulltable-field-name", key);
					$(tr).append($(td));
				}
			}
			var row = {};
			$(tr).children("td").each(function(td_index, td) {
				var key = table.keys[td_index];
				if (key != null) $(td).attr("fulltable-field-name", key);
				var value;
				if (data == null) {
					value = $(td).text();
				} else {
					value = data[key];
				}
				var text = value;
				var fieldData = options.fields[key];
				if (fieldData == null) fieldData = {};
				// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
				if (fieldData.options != null) {
					text = "";
					var found = false;
					for (var option in fieldData.options) {
						option = fieldData.options[option];
						if (option.value == value) {
							text = option.title;
							found = true;
							break;
						}
					}
					if (!found) value = null;
				}
				row[key] = value;
				$(td).text(text);
			});
			row["__dom"] = $(tr);
			row["__filtered"] = false;
			addSelectionControl(row, "body");
			addEditionControl(row, "body");
			return row;
		};

		var getBodyFromDom = function() {
			$(table).find("tbody tr").each(function(tr_index, tr) {
				table.rows[tr_index] = drawRow(null, tr);
			});
		};
		
		var addEditionControl = function(row, type) {
			if (!options.editable) return;
			if (typeof row != "object") return;
			var tr = row["__dom"];
			if (!$(tr).is("tr")) return;
			if ($(tr).find(".fulltable-edition-control").length > 0) return;
			var edition_control = null;
			if ($(tr).parent().is("thead") || type == "head") {
				edition_control = $("<th>", {
					'class':"fulltable-edition-control"
				});
			}
			if ($(tr).parent().is("tbody") || type == "body") {
				edition_control = $("<td/>", {
					'class':"fulltable-edition-control"
				});
				edition_control.append($("<a/>", {
					'class':"fulltable-edit"
				}).click(function() {
					editRow(row);
				}));
				edition_control.append($("<a/>", {
					'class':"fulltable-remove"
				}).click(function() {
					removeRow(row);
				}));
				edition_control.append($("<a/>", {
					'class':"fulltable-save"
				}).click(function() {
					saveRow(row);
				}));
				edition_control.append($("<a/>", {
					'class':"fulltable-discard"
				}).click(function() {
					discardRow(row);
				}));
			}
			$(tr).append($(edition_control));
		};

		var addSelectionControl = function(row, type) {
			if (!options.selectable) return;
			if (typeof row != "object") return;
			var tr = row["__dom"];
			if (!$(tr).is("tr")) return;
			if ($(tr).find(".fulltable-selection-control").length > 0) return;
			var selection_control = null;
			if ($(tr).parent().is("thead") || type == "head") {
				selection_control = $("<th>", {
					'class':"fulltable-selection-control"
				});
			}
			if ($(tr).parent().is("tbody") || type == "body") {
				selection_control = $("<td/>", {
					'class':"fulltable-selection-control"
				});
				selection_control.append($("<input/>", {
					'type':"checkbox",
					'value':row["__selected"]
				}).change(function() {
					checkRow(row);
				}));
			}
			$(tr).prepend($(selection_control));
		};
		
		var showRowForm = function(row) {
			for (var fieldName in row) {
				if (fieldName.indexOf("__") == 0) continue;
				var value = row[fieldName];
				var td = $(row["__dom"]).find("td[fulltable-field-name='" + fieldName + "']");
				$(td).empty();
				var fieldData = options.fields[fieldName];
				if (fieldData == null) fieldData = {};
				var input;
				// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
				if (fieldData.options != null) {
					input = $("<select>", {
						'disabled':fieldData.disabled
					});
					var optionDom = $("<option>", {
						'disabled':options.mandatory,
						'text':options.placeholder,
						'value':null
					});
					$(input).append($(optionDom));
					for (var option in fieldData.options) {
						option = fieldData.options[option];
						optionDom = $("<option>", {
							'text':option.title,
							'value':option.value
						});
						$(input).append($(optionDom));
					}
				} else {
					input = $("<input>", {
						'type':"text",
						'disabled':fieldData.disabled
					});
				}
				if (value != null) $(input).val(value);
				$(input).change(function(event) {
					$(event.target).removeClass("invalid");
				});
				$(input).keyup(function(event) {
					$(event.target).removeClass("invalid");
				});
				$(td).append($(input));
			}
			$(row["__dom"]).addClass("fulltable-editing");
		};
		
		var methods = {
			'on':function(eventName, eventHandler) {
				if (typeof eventName != "string" || typeof eventHandler != "function") return;
				if (eventName != "on" && methods[eventName] != null) {
					table.events[eventName] = function() {
						console.log("Event fired: " + eventName);
						eventHandler.apply(this, arguments);
					};
				}
			},
			'clean':function() {
				$(table).find(".fulltable-edition-control, .fulltable-sort, .fulltable-filter").remove();
				$(table).removeClass(function (index, className) {
					return (className.match("/(^|\s)fulltable-\S+/g") || []).join(' ');
				});
				$(table).find("*").removeClass(function (index, className) {
					return (className.match("/(^|\s)fultablle-\S+/g") || []).join(' ');
				});
				var dataKeys = ["fulltable-creating", "fulltable-editing"];
				for (var dataKey in dataKeys) {
					$(table).removeData(dataKey);
					$(table).find("*").removeData(dataKey);
				}
				if (typeof table.events.clean == "function") table.events.clean();
			},
			'changeSettings':function(newOptionsPart) {
				if (typeof newOptionsPart != "object") return this;
				for (var key in options) {
					if (newOptionsPart[key] == null) continue;
					if (key == "fields") {
						var fields = options["fields"]
						var newFields = newOptionsPart["fields"];
						if (typeof newFields != "object") continue;
						for (var newFieldName in newFields) {
							var newField = newFields[newFieldName];
							if (fields[newFieldName] == null) {
								fields[newFieldName] = newField;
								continue;
							}
							for (var key in newField) {
								fields[newFieldName][key] = newFields[newFieldName][key];
							}
						}
						continue;
					}	
					options[key] = newOptionsPart[key];
				}
				draw();
				if (typeof table.events.changeSettings == "function") table.events.changeSettings(newOptionsPart, options);
				return this;
			},
			'draw':function() {
				drawHeader();
				drawBody();
				return this;
			},
			'drawHeader':function() {
				// Drawing of header
				$(table).find("thead th:not(.fulltable-edition-control):not(.fulltable-selection-control)").each(function(th_index, th) {
					var fieldName = $(th).attr("fulltable-field-name");
					var apply_order = function(reverse) {
						var fieldSort = 0;
						if ($(th).hasClass("fulltable-asc")) {
							fieldSort = 1;
						} else if ($(th).hasClass("fulltable-desc")) {
							fieldSort = -1;
						}
						if (reverse) fieldSort = -fieldSort;
						addSortItem(fieldName, fieldSort);	
					};
					apply_order(false);
					
					// Insertion of ordenation button.
					$(th).children("a.fulltable-sort").remove();
					if (options.orderable) {
						var fieldData = options.fields[fieldName];
						if (fieldData == null) fieldData = {};
						if (fieldData.orderable == null || fieldData.orderable == true) {
							var sortElement = $("<a/>").addClass("fulltable-sort");
							$(sortElement).click(function(event) {
								apply_order(true);
								order(table.sorting);
							});
							$(th).append(sortElement);
						}
					}			
					// Insertion of filtering fields.
					$(th).children("input.fulltable-filter, select.fulltable-filter").remove();
					if (options.filterable) {
						var fieldData = options.fields[fieldName];
						if (fieldData == null) fieldData = {};
						if (fieldData.filterable == null || fieldData.filterable == true) {
							var filterFieldElement;
							// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
							if (fieldData.options != null) {
								filterFieldElement = $("<select>", {
									'class':"fulltable-filter"
								});
								var optionDom = $("<option>", {
									'text':fieldData.options.placeholder,
									'value':null
								});
								$(filterFieldElement).append($(optionDom));
								// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
								for (var option in fieldData.options) {
									option = fieldData.options[option];
									optionDom = $("<option>", {
										'text':option.title,
										'value':option.value
									});
									$(filterFieldElement).append($(optionDom));
								}
							} else {
								filterFieldElement = $("<input/>", {
									'class':"fulltable-filter",
									'type':"text"
								});
							}
							$(th).append(filterFieldElement);
						}
					}
				}).removeClass("fulltable-asc").removeClass("fulltable-desc").addClass("fulltable-asc");
				
				$(table).find("input, select").change(function(event) {
					filter();
				});
				$(table).find("input, select").keyup(function(event) {
					filter();
				});
		
				// Appending of header for edition controls
				addEditionControl({"__dom":$(table).find("thead tr")}, "head");
				addSelectionControl({"__dom":$(table).find("thead tr")}, "head");
				if (typeof table.events.drawHeader == "function") table.events.drawHeader();
				return this;
			},
			'drawBody':function() {
				$(table).find("tbody tr").detach();
				for (var row in table.rows) {
					row = table.rows[row];
					if ((row["__filtered"] && !row["__creating"]) || row["__removed"]) continue;
					row["__invalidOptionRemoved"] = false;
					for (var fieldName in row) {
						$(row["__dom"]).find("td[fulltable-field-name='" + fieldName + "']").empty();
						var value = row[fieldName];
						var text = value;
						var fieldData = options.fields[fieldName];
						if (fieldData == null) fieldData = {};
						if (fieldData.options != null) {
							// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
							var found = false;
							if (value == null) {
								if (!fieldData.mandatory) found = true;
							} else {
								for (var option in fieldData.options) {
									option = fieldData.options[option];
									if (option.value == value) {
										found = true;
										text = option.title;
										break;
									}
								}
							}
							row["__invalidOptionRemoved"] = row["__invalidOptionRemoved"] || !found; // If option is not in option list, this restriction must be activated.
						} else {
							row["__invalidOptionRemoved"] = row["__invalidOptionRemoved"] || false; // If options has been removed from field settings, this restriction must be also removed.
						}
						if (value == null) text = "";
						$(row["__dom"]).find("td[fulltable-field-name='" + fieldName + "']").text(text);
						if (row["__invalidOptionRemoved"]) break;
					}
					if (row["__invalidOptionRemoved"] && !row["__creating"]) continue;
					if ($(row["__dom"]).data("fulltable-editing")) {
						showRowForm(row);
					}
					$(table).find("tbody").append(row["__dom"]);
				}
				if (typeof table.events.drawBody == "function") table.events.drawBody(table.rows);
				return this;
			},
			'filter':function() {
				for (var row in table.rows) {
					row = table.rows[row];
					row["__filtered"] = false;
					$(table).find("tbody").append($(row["__dom"]));
				}
				$(table).find("thead th input.fulltable-filter, thead th select.fulltable-filter").each(function (i, e) {
					var filtering_value = $(e).val();
					var fieldName = $(e).parent("th").attr("fulltable-field-name");
					for (var row in table.rows) {
						row = table.rows[row];
						var filtered_value = row[fieldName]; 
						var filtered = false;
						if ($(row["__dom"]).data("fulltable-editing")) continue;
						var fieldData = options.fields[fieldName];
						if (fieldData == null) fieldData = {};
						// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
						if (fieldData.options != null) {
							filtered = (filtering_value != null && filtering_value != '' && filtered_value != filtering_value);
						} else {
							filtered = (filtering_value != null && filtering_value != '' && filtered_value.toUpperCase().indexOf(filtering_value.toUpperCase()) < 0);
						}
						if (filtered) {
							$(row["__dom"]).detach();
							row["__filtered"] = true;
						}
					}
				});
				if (typeof table.events.order == "function") table.events.filter();
				order();
				return this;
			},
			'order':function(sorting) {
				var fields = table.sorting;
				if (Array.isArray(sorting)) {
					sorting = sorting.reverse();
					for (var sortingItem in sorting) {
						sortingItem = sorting[sortingItem];
						if (sortingItem.name != null && typeof(sortingItem.sort) == "number") {
							addSortItem(sortingItem.name, sortingItem.sort);
						}
					}
				}
				var compareFunction = function(field, order) {
					if (order == null) order = 1;
					var result = function (a, b) {
						if (a["__creating"] == true) return 1;
						if (b["__creating"] == true) return -1;
						if (a == null || b == null) return 0;
						var fieldData = options.fields[field];
						if (fieldData == null) fieldData = {};
						// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
						if (fieldData.options != null) {
							var foundA = false, foundB = false;
							for (var option in fieldData.options) {
								option = fieldData.options[option];
								if (!foundA && option["value"] == a[field]) {
									a = option["title"]; 
									foundA = true;
								}
								if (!foundB && option["value"] == b[field]) {
									b = option["title"]; 
									foundB = true;
								}
								if (foundA && foundB) break;
							}
						} else {
							a = a[field];
							b = b[field];
						}
						if (a == null || b == null) return 0;
						if (!isNaN(a) && !isNaN(b)) {
							a = Number(a);
							b = Number(b);
							return order*(a - b);
						} else {
							if (a < b)
								return order*(-1);
							else if (a == b)
								return 0;
							else
								return order*(1);
						}
					};
					return result;
				};
				if (!Array.isArray(fields) || fields.length == 0) return this;
				for (var field in fields) {
					field = fields[field];
					table.rows = table.rows.sort(compareFunction(field.name, field.sort));
					var head = $(table).find("thead th[fulltable-field-name='" + field.name + "']"); // TODO: Improve saving header in all rows by reference.
					$(head).removeClass("fulltable-asc").removeClass("fulltable-desc");
					if (field.sort >= 0) $(head).addClass("fulltable-asc");	
					else $(head).addClass("fulltable-desc");	
				}
				drawBody();
				if (typeof table.events.order == "function") table.events.order();
				return this;
			},
			'validateRow':function(row, writeRow) {
				if (typeof row != "object") return this;
				var error = false;
				var errors = [];
				var values = {};
				var texts = {};
				row["__validated_texts"] = texts;
				row["__validated_values"] = values;
				for (var fieldName in row) {
					var fieldError = false;
					if (fieldName.indexOf("__") == 0) continue;
					var fieldData = options.fields[fieldName] || {};
					var td = $(row["__dom"]).find("td[fulltable-field-name='" + fieldName + "']");
					var value = null;
					var text = null;
					if ($(td).find("input").length > 0) {
						value = $(td).find("input").val();
						text = value;
					} else if ($(td).find("select").length > 0) {
						value = $(td).find("select").val();
					} else {
						text = $(td).text();
					}
					// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
					if (fieldData.options != null) {
						var found = false;
						for (var option in fieldData.options) {
							option = fieldData.options[option];
							if (option["value"] == value) {
								text = option["title"]; 
								found = true;
								break;
							} else {
								if (text = "") text = null;
								if (option["value"] == text) {
									value = option["value"];
									text = option["title"]; 
									found = true;
									break;
								}
							}
						}
						if (!found) {
							value = null;
						}
					}
					if (value == "") value = null;
					
					// Validations: 
					if (value == null && fieldData.mandatory) {
						fieldError = true;
						if (fieldData.errors != null && fieldData.errors.mandatory != null) {
							errors.push(fieldData.errors.mandatory);
						}
					}
					if (value != null && fieldData.type != null && types[fieldData.type] != null) {
						var type = null;
						for (var typeEntry in types) {
							var typeNames = types[typeEntry];
							if (typeNames.indexOf(fieldData.type) >= 0) {
								type = typeEntry;
								break;
							}
						}
						switch (type) {
							case "decimal":
								if (isNaN(value)) {
									fieldError = true;
									if (fieldData.errors != null && fieldData.errors.type != null) {
										errors.push(fieldData.errors.type);
										value = null;
									}
									break;
								}
								value = Number(value);
								break;
							case "integer":
								if (isNaN(value)) {
									fieldError = true;
									if (fieldData.errors != null && fieldData.errors.type != null) {
										errors.push(fieldData.errors.type);
										value = null;
									}
									break;
								}
								value = Number(value);
								if (Math.floor(value) != value) {
									fieldError = true;
									if (fieldData.errors != null && fieldData.errors.type != null) {
										errors.push(fieldData.errors.type);
										value = null;
									}
									break;
								}
							break;
							case "string":
							default:
							
							break;
						}
					}
					if (value != null && typeof fieldData.validator == "function") {
						if (!(fieldData.validator(value, row, table.rows, table) === true)) {
							fieldError = true;
							if (fieldData.errors != null && fieldData.errors.validator != null) {
								errors.push(fieldData.errors.validator);
								value = null;
							}
						}
					}
					
					if (value == null) text = "";
					values[fieldName] = value;
					texts[fieldName] = text;
					
					if (writeRow == null) writeRow = false;
					if (writeRow) {
						for (var fieldName in values) {
							if ($(td).find("input, select").length > 0) {
								$(td).find("input, select").val(value);
							} else {
								$(td).empty();
								$(td).text(text);
							}
						}
					}
					if (fieldError) {
						$(td).find("input, select").addClass("invalid");
						if (typeof table.events.error == "function") table.events.error(errors);
						error = true;
					}
				}
				return !error;
			},
			'addRow':function() {
				if (!options.editable) return this;
				if ($(table).data("fulltable-creating")) return this;
				$(table).data("fulltable-creating", true);
				var row = {};
				var row_index = table.rows.length;
				table.rows[row_index] = row;
				row["__creating"] = true;
				row["__dom"] = $("<tr/>");
				row["__filtering"] = false; 
				for (var fieldName in table.keys) {
					fieldName = table.keys[fieldName];
					var td = $("<td/>", {
						'fulltable-field-name': fieldName
					});
					$(row["__dom"]).append($(td));
					row[fieldName] = "";
				}
				$(table).children("tbody").append($(row["__dom"]));
				addEditionControl(row, "body");
				$(row["__dom"]).data("fulltable-editing", true);
				showRowForm(row);
				if (typeof table.events.addRow == "function") table.events.addRow(row);
				return this;
			},
			'editRow':function(row) {
				if (!options.editable) return this;
				if (typeof row != "object") return this;
				$(row["__dom"]).data("fulltable-editing", true);
				showRowForm(row);
				if (typeof table.events.editRow == "function") table.events.editRow(row);
				return this;
			},
			'removeRow':function(row) {
				if (!options.editable) return this;
				if (typeof row != "object") return this;
				row["__removed"] = true;
				$(row["__dom"]).detach();
				for (var fieldName in row) {
					if (fieldName.indexOf("__") == 0) continue;
					var value = row[fieldName];
					var td = $(row["__dom"]).find("td[fulltable-field-name='" + fieldName + "']");
					$(td).empty();
					var input = $("<input>", {
						'type':"text",
						'value':value
					});
					$(td).append($(input));
				}
				if (typeof table.events.removeRow == "function") table.events.removeRow(row);
				return this;
			},
			'saveRow':function(row) {
				if (!options.editable) return this;
				if (typeof row != "object") return this;
				if (!validateRow(row)) return this;
				$(row["__dom"]).removeClass("fulltable-editing");
				$(row["__dom"]).data("fulltable-editing", false);
				if (row["__creating"]) {
					$(table).data("fulltable-creating", false);
					row["__creating"] = false;
				}
				for (var fieldName in row) {
					if (fieldName.indexOf("__") == 0) continue;
					var td = $(row["__dom"]).find("td[fulltable-field-name='" + fieldName + "']");
					$(td).empty();
					$(td).text(row["__validated_texts"][fieldName]);
					row[fieldName] = row["__validated_values"][fieldName];
				}
				if (typeof table.events.saveRow == "function") table.events.saveRow(row);
				return this;
			},
			'discardRow': function(row) {
				if (!options.editable) return this;
				if (typeof row != "object") return this;
				$(row["__dom"]).data("fulltable-editing", false);
				$(row["__dom"]).removeClass("fulltable-editing");
				if (row["__creating"]) {
					$(table).data("fulltable-creating", false);
					row["__creating"] = false;
					row["__removed"] = true;
					$(row["__dom"]).detach();
				} else {
					for (var fieldName in row) {
						if (fieldName.indexOf("__") == 0) continue;
						var value = row[fieldName];
						var text = value;
						if (text == null) text = "";
						var fieldData = options.fields[fieldName] || {};
						// TODO: Here must be validation of input type: select, checkbox, if (fieldData.options == "boolean")
						if (fieldData.options != null) {
							text = "";
							for (var option in fieldData.options) {
								option = fieldData.options[option];
								if (option["value"] == value) {
									text = option["title"]; 
									break;
								}
							}
						}
						var td = $(row["__dom"]).find("td[fulltable-field-name='" + fieldName + "']");
						$(td).empty();
						$(td).text(text);
					}
				}
				if (typeof table.events.discardRow == "function") table.events.discardRow(row);
				return this;
			},
			'checkRow': function(row) {
				if (row["__selected"] == null) row["__selected"] = false;
				row["__selected"] = !row["__selected"]; 
				if (typeof table.events.checkRow == "function") table.events.checkRow(row);
			},
			'getData':function(selected) {
				var result = [];
				for (var row in table.rows) {
					row = table.rows[row];
					if (row["__selected"] == null) row["__selected"] = false;
					if (selected === false && row["__selected"] == true) continue;
					if (selected === true && row["__selected"] == false) continue;
					var resultRow = {};
					if (row["__removed"] == true || row["__invalidOptionRemoved"]) continue;
					result.push(resultRow);
					for (var fieldName in row) {
						if (fieldName.indexOf("__") == 0) continue;
						var value = row[fieldName];
						resultRow[fieldName] = value;
					}
				}
				if (typeof table.events.getData == "function") table.events.getData();
				return result;
			},
			'setData':function(data) {
				if (!Array.isArray(data)) {
					return this;
				}
				var oldData = table.rows.splice(0, table.rows.length);
				var newData = data;
				for (var rowData in data) {
					rowData = data[rowData];
					var row = drawRow(rowData, null);
					if (!validateRow(row)) continue;
					table.rows.push();
				}
				drawBody();
				if (typeof table.events.setData == "function") table.events.setData(oldData, newData);
				return this;
			},
			'error': function() {
				return this;
			}
		};

		// DEPRECATED: Compatibility, uncomment if needed
		/*
		methods['create'] = methods['addRow'];
		methods['edit'] = methods['editRow'];
		methods['remove'] = methods['removeRow'];
		methods['save'] = methods['saveRow'];
		methods['discard'] = methods['discardRow'];
		methods['getValue'] = methods['getData'];
		*/
		
		var defaults = {
			"editable":true,
			"filterable":true,
			"orderable":true,
			"selectable":false,
			"fields":{},
			"on":{
				"update":function() {
					
				}
			}
		};
		
		var options = $(table).data('options');
		
		var method = null;
		var methodArguments = null;
		
		if (typeof arguments[0] == "string") {
			if (options == null) return this;
			method = methods[arguments[0]];
			methodArguments = Array.prototype.slice.call(arguments, 1);
			if (typeof method != "function") return this;
			return method.apply(this, methodArguments);
		}
		
		if (options == null) {
			if (typeof arguments[0] == "object") {
				options = arguments[0];
				options = $.extend(true, defaults, options);
			} else {
				options = defaults;
			}
			$(table).data('options', options);
		}

		$(table).addClass("fulltable");
		if (options.editable) {
			$(table).addClass("fulltable-editable");
		}
		
		getHeaderFromDom();
		drawHeader();
		getBodyFromDom();
		drawBody();
		
		return this;
    };
}(jQuery));