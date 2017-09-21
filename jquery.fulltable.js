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
        
		var table = $(this);
				
		var keys = $(table).data('fulltable-keys');
		var rows = $(table).data('fulltable-rows');
		var sorting = $(table).data('fulltable-sorting');

		if (keys == null) {
			keys = [];
			$(table).data('fulltable-keys', keys);
		}
		if (rows == null) {
			rows = [];
			$(table).data('fulltable-rows', rows);
		}
		if (sorting == null) {
			sorting = [];
			$(table).data('fulltable-sorting', sorting);
		}

		var clean = function() {
			methods['clean'].apply(this, arguments);
		};
		
		var changeSettings = function() {
			methods['changeSettings'].apply(this, arguments);
		};
		
		var drawHeader = function() {
			methods['drawHeader'].apply(this, arguments);
		};
		
		var drawBody = function() {
			methods['drawBody'].apply(this, arguments);
		};
		
		var draw = function() {
			methods['draw'].apply(this, arguments);
		};

		var filter = function() {
			methods['filter'].apply(this, arguments);
		};
		
		var order = function() {
			methods['order'].apply(this, arguments);
		};
				
		var addRow = function() {
			methods['addRow'].apply(this, arguments);
		};

		var editRow = function() {
			methods['editRow'].apply(this, arguments);
		};

		var removeRow = function() {
			methods['removeRow'].apply(this, arguments);
		};

		var saveRow = function() {
			methods['saveRow'].apply(this, arguments);
		};

		var discardRow = function() {
			methods['discardRow'].apply(this, arguments);
		};
		
		var getHeaderFromDom = function() {
			// Init headers and field names.		
			$(table).find("thead th").each(function(th_index, th) {
				var field_name = $(th).attr("fulltable-field-name");
				if (field_name == null) {
					field_name = (new Date()).getTime()+""+(Math.floor(Math.random()*1e8));
					$(th).attr("fulltable-field-name", field_name);
				}
				keys[th_index] = field_name;
			});
		};
		
		var drawRow = function(data, tr) {
			if (typeof data != "object") data = null;
			if (tr == null) {
				tr = $("<tr/>");
				for (var key in keys) {
					key = keys[key];
					var td = $("<td/>");
					$(td).attr("fulltable-field-name", key);
					$(tr).append($(td));
				}
			}
			var row = {};
			$(tr).children("td").each(function(td_index, td) {
				var key = keys[td_index];
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
			addEditionControl(row, "body");
			return row;
		};

		var getBodyFromDom = function() {
			$(table).find("tbody tr").each(function(tr_index, tr) {
				rows[tr_index] = drawRow(null, tr);
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

		var showRowForm = function(row) {
			for (var field_name in row) {
				if (field_name.indexOf("__") == 0) continue;
				var value = row[field_name];
				var td = $(row["__dom"]).find("td[fulltable-field-name='" + field_name + "']");
				$(td).empty();
				var fieldData = options.fields[field_name];
				if (fieldData == null) fieldData = {};
				var input;
				if (fieldData.options != null) {
					input = $("<select>");
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
						'type':"text"
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
		
		if (!this.is('table')) {
            throw new Error('FullTable only works when is applied to table, for now.');
        }
		
		var methods = {
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
				return this;
			},
			'draw':function() {
				drawHeader();
				drawBody();
				return this;
			},
			'drawHeader':function() {
				// Drawing of header
				$(table).find("thead th:not(.fulltable-edition-control)").each(function(th_index, th) {
					var field_name = $(th).attr("fulltable-field-name");
					var apply_order = function(reverse) {
						var field_sort = 0;
						if ($(th).hasClass("fulltable-asc")) {
							field_sort = 1;
						} else if ($(th).hasClass("fulltable-desc")) {
							field_sort = -1;
						}
						if (reverse) field_sort = -field_sort;
						var removing_indexes = [];
						for (var index in sorting) {
							var sorting_item = sorting[index];
							if (sorting_item.name == field_name) {
								removing_indexes.push(index);
							}
						}
						removing_indexes = removing_indexes.reverse();
						for (var index in removing_indexes) {
							index = removing_indexes[index];
							sorting.splice(index, 1);
						}
						sorting.push({
							name: field_name,
							sort: field_sort
						});
					};
					apply_order(false);
					
					// Insertion of ordenation button.
					$(th).children("a.fulltable-sort").remove();
					if (options.orderable) {
						var fieldData = options.fields[field_name];
						if (fieldData == null) fieldData = {};
						if (fieldData.orderable == null || fieldData.orderable == true) {
							var sortElement = $("<a/>").addClass("fulltable-sort");
							$(sortElement).click(function(event) {
								apply_order(true);
								order(sorting);
							});
							$(th).append(sortElement);
						}
					}			
					// Insertion of filtering fields.
					$(th).children("input.fulltable-filter, select.fulltable-filter").remove();
					if (options.filterable) {
						var fieldData = options.fields[field_name];
						if (fieldData == null) fieldData = {};
						if (fieldData.filterable == null || fieldData.filterable == true) {
							var filterFieldElement;
							if (fieldData.options != null) {
								filterFieldElement = $("<select>", {
									'class':"fulltable-filter"
								});
								var optionDom = $("<option>", {
									'text':options.placeholder,
									'value':null
								});
								$(filterFieldElement).append($(optionDom));
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
				return this;
			},
			'drawBody':function() {
				$(table).find("tbody tr").detach();
				for (var row in rows) {
					row = rows[row];
					if ((row["__filtered"] && !row["__creating"]) || row["__removed"]) continue;
					row["__invalidOptionRemoved"] = false;
					for (var field_name in row) {
						$(row["__dom"]).find("td[fulltable-field-name='" + field_name + "']").empty();
						var value = row[field_name];
						var text = value;
						var fieldData = options.fields[field_name];
						if (fieldData == null) fieldData = {};
						if (fieldData.options != null) {
							var found = false;
							for (var option in fieldData.options) {
								option = fieldData.options[option];
								if (option.value == value) {
									found = true;
									text = option.title;
									break;
								}
							}
							row["__invalidOptionRemoved"] = row["__invalidOptionRemoved"] || !found; // If option is not in option list, this restriction must be activated.
						} else {
							row["__invalidOptionRemoved"] = row["__invalidOptionRemoved"] || false; // If options has been removed from field settings, this restriction must be also removed.
						}
						$(row["__dom"]).find("td[fulltable-field-name='" + field_name + "']").text(text);
						if (row["__invalidOptionRemoved"]) break;
					}
					if (row["__invalidOptionRemoved"] && !row["__creating"]) continue;
					if ($(row["__dom"]).data("fulltable-editing")) {
						showRowForm(row);
					}
					$(table).find("tbody").append(row["__dom"]);
				}
				return this;
			},
			'filter':function() {
				for (var row in rows) {
					row = rows[row];
					row["__filtered"] = false;
					$(table).find("tbody").append($(row["__dom"]));
				}
				$(table).find("thead th input.fulltable-filter, thead th select.fulltable-filter").each(function (i, e) {
					var filtering_value = $(e).val();
					var field_name = $(e).parent("th").attr("fulltable-field-name");
					for (var row in rows) {
						row = rows[row];
						var filtered_value = row[field_name]; 
						var filtered = false;
						if ($(row["__dom"]).data("fulltable-editing")) continue;
						var fieldData = options.fields[field_name];
						if (fieldData == null) fieldData = {};
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
				order();
				return this;
			},
			'order':function() {
				var fields = sorting;
				var compareFunction = function(field, order) {
					if (order == null) order = 1;
					var result = function (a, b) {
						if (a["__creating"] == true) return 1;
						if (b["__creating"] == true) return -1;
						if (a == null || b == null) return 0;
						var fieldData = options.fields[field];
						if (fieldData == null) fieldData = {};
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
				if (typeof fields != "object") return this;
				for (var field in fields) {
					field = fields[field];
					rows = rows.sort(compareFunction(field.name, field.sort));
					var head = $(table).find("thead th[fulltable-field-name='" + field.name + "']"); // TODO: Improve saving header in all rows by reference.
					$(head).removeClass("fulltable-asc").removeClass("fulltable-desc");
					if (field.sort >= 0) $(head).addClass("fulltable-asc");	
					else $(head).addClass("fulltable-desc");	
				}
				drawBody();
				return this;
			},
			'addRow':function() {
				if (!options.editable) return this;
				if ($(table).data("fulltable-creating")) return this;
				$(table).data("fulltable-creating", true);
				var row = {};
				var row_index = rows.length;
				rows[row_index] = row;
				row["__creating"] = true;
				row["__dom"] = $("<tr/>");
				row["__filtering"] = false; 
				for (var field_name in keys) {
					field_name = keys[field_name];
					var td = $("<td/>", {
						'fulltable-field-name': field_name
					});
					$(row["__dom"]).append($(td));
					row[field_name] = "";
				}
				$(table).children("tbody").append($(row["__dom"]));
				addEditionControl(row, "body");
				$(row["__dom"]).data("fulltable-editing", true);
				showRowForm(row);
				return this;
			},
			'editRow':function(row) {
				if (!options.editable) return this;
				if (typeof row != "object") return this;
				$(row["__dom"]).data("fulltable-editing", true);
				showRowForm(row);
				return this;
			},
			'removeRow':function(row) {
				if (!options.editable) return this;
				if (typeof row != "object") return this;
				row["__removed"] = true;
				$(row["__dom"]).detach();
				for (var field_name in row) {
					if (field_name.indexOf("__") == 0) continue;
					var value = row[field_name];
					var td = $(row["__dom"]).find("td[fulltable-field-name='" + field_name + "']");
					$(td).empty();
					var input = $("<input>", {
						'type':"text",
						'value':value
					});
					$(td).append($(input));
				}
				return this;
			},
			'saveRow':function(row) {
				if (!options.editable) return this;
				if (typeof row != "object") return this;
				var error = false;
				for (var field_name in row) {
					if (field_name.indexOf("__") == 0) continue;
					var fieldData = options.fields[field_name] || {};
					if (!fieldData.mandatory) continue;
					var td = $(row["__dom"]).find("td[fulltable-field-name='" + field_name + "']");
					var value = $(td).find("input, select").val();
					if ((value == null || value == '')) {
						$(td).find("input, select").addClass("invalid");
						error = true;
					}
				}
				if (error == true) return this;
				$(row["__dom"]).removeClass("fulltable-editing");
				$(row["__dom"]).data("fulltable-editing", false);
				if (row["__creating"]) {
					$(table).data("fulltable-creating", false);
					row["__creating"] = false;
				}
				for (var field_name in row) {
					if (field_name.indexOf("__") == 0) continue;
					var fieldData = options.fields[field_name] || {};
					var td = $(row["__dom"]).find("td[fulltable-field-name='" + field_name + "']");
					var value = $(td).find("input, select").val();
					var text = value;
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
					row[field_name] = value;
					$(td).empty();
					$(td).text(text);
				}
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
					for (var field_name in row) {
						if (field_name.indexOf("__") == 0) continue;
						var value = row[field_name];
						var text = value;
						var fieldData = options.fields[field_name] || {};
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
						var td = $(row["__dom"]).find("td[fulltable-field-name='" + field_name + "']");
						$(td).empty();
						$(td).text(text);
					}
				}
				return this;
			},
			'getData':function() {
				var result = [];
				for (var row in rows) {
					row = rows[row];
					var resultRow = {};
					if (row["__removed"] == true || row["__invalidOptionRemoved"]) continue;
					result.push(resultRow);
					for (var field_name in row) {
						if (field_name.indexOf("__") == 0) continue;
						var value = row[field_name];
						resultRow[field_name] = value;
					}
				}
				return result;
			},
			'setData':function(data) {
				if (!Array.isArray(data)) {
					return this;
				}
				rows.splice(0, rows.length);
				for (var rowData in data) {
					rowData = data[rowData];
					rows.push(drawRow(rowData, null));
				}
				drawBody();
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
			"fields":{}
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