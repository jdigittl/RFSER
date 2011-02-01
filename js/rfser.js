var receiptUploadOptions = {
	success: handleReceiptUpload,
	dataType: 'json'
};

function calcTotal() {
	var subTotal = 0;

	$('.inputRow > td > input[name="amount"]').each(function(idx,e) {
		amt = parseFloat($(e).val());
		if (!isNaN(amt) && (amt > 0)) {
			subTotal += amt;
		}
	});

	$('#total').text('$' + subTotal);
}
	
function validate() {
	var isValid = true;

	var reportName = $('input#reportName').val();
	var employee = $('input#employee').val();

	if (reportName == 'Report Name' || reportName.length == 0) {
		$('input#reportName').addClass('invalid');
		isValid = false;
	} else {
		$('input#reportName').removeClass('invalid');
	}

	if (employee == 'Your Name' || employee.length == 0) {
		$('input#employee').addClass('invalid');
		isValid = false;
	} else {
		$('input#employee').removeClass('invalid');
	}

	$('.inputRow > td > input[name="description"]:enabled').each(function(idx,e){
		if ($(e).val().length < 3) {
			$(e).addClass('invalid');
			isValid = false;
		} else {
			$(e).removeClass('invalid');
		}
	});

	$('.inputRow > td > input[name="amount"]:enabled').each(function(idx,e){
		var amt = parseFloat($(e).val());
		if (amt <= 0 || isNaN(amt)) {
			$(e).addClass('invalid');
			isValid = false;
		} else {
			$(e).removeClass('invalid');
		}
	});
	return isValid;
}

function handleReceiptUpload (response, statusText, xhr, form) {
	form.empty();
	$(form).css('background','none');
	var img = form.siblings('img')[0];
	$(img).attr("src", '/receipt/' + response['receipt_id'] + '/image');
	form.parent().parent().attr('receipt_id', response['receipt_id']);
}

function addRow() {
	var summary = $('.totalRow').clone();
	$('.totalRow').remove();

	var clone = $('.inputRow:last').clone()

	$('.inputRow:last > td > form.imageForm').css('background','url(/img/spinner.gif) 0 0 no-repeat');
	$('.inputRow:last > td > form.imageForm').ajaxSubmit(receiptUploadOptions);


	$('.inputRow:last > td > input').removeAttr('disabled');

	$(clone).css('display', 'none');

	$(clone).appendTo('table');
	$('.inputRow:last > td > input').val('');
	$('.inputRow:last > td > form > input').val('');

	$('.inputRow:last > td > form > input:file').change(addRow);
	$('.inputRow:last > td > form.imageForm').ajaxForm();

	summary.appendTo('table');
	$('.inputRow:last > td > input[name="amount"]').keyup(calcTotal);

	$(clone).fadeIn(1000);
}

function saveReport() {
	var isValid = validate();

	if (!isValid) return;

	var reportName = $('input#reportName').val();
	var employee = $('input#employee').val();

	$.post(window.location.pathname, {reportName: reportName, employee: employee});

	$('.inputRow').each(function(idx,e) {
		var receipt_id = $(e).attr('receipt_id');
		if (receipt_id != undefined) {
			var amount = $(e).find('input[name="amount"]').val();
			var description = $(e).find('input[name="description"]').val();
			$.post('/receipt/' + receipt_id + '/details', {amount: amount, description: description});
		}
	});

	$('#save').fadeOut(function(){
		$('#finishedReport').fadeIn();
	});	
}

function createReceipt(receipt_id, description, amount) {
	var clone = $('.inputRow:last').clone()
	$(clone).find('input[name="amount"]').val(amount);
	$(clone).find('input[name="description"]').val(description);
	$(clone).find('input[name="description"]').val(description);
	$(clone).find('input:file').remove();
	$(clone).find('.imageForm').css('background','none');
	$(clone).find('img').attr("src", '/receipt/' + receipt_id + '/image');
	$(clone).appendTo('table');
}

function loadReportReceipts(data) {
	var receipts = eval(data); // TODO : evil

	for (r in receipts) {
		createReceipt(receipts[r]['receipt_id'], receipts[r]['description'], receipts[r]['amount']);
	}

	if (receipts.length > 0) {
		// If there is any data, don't let people add more data
		$('.inputRow:first').remove();
		$('#save').remove();

		$('#finishedReport').show();

		var clone = $('.totalRow').clone();
		$('.totalRow').remove();
		$(clone).appendTo('table');
		calcTotal();	
	}
}

function loadReportDetails(data) {
	var details = eval(data)[0]; //TODO: Evil
	if (details['reportName'] != '') {
		$('input#reportName').val(details['reportName']);
		$('#reportName_placeholder').hide();
	}
	if (details['employee'] != '') {
		$('input#employee').val(details['employee']);
		$('#employee_placeholder').hide();
	}
	$('li#reimbursed > span').text(details['reimbursed']);
	if (details['reimbursed'] != 'No') $('#reimburse').hide();
}

function collect () {
	var curl = $('input[name="url"]').val();
	var report_id = window.location.pathname.split('/').pop();
	$.post(curl + '/add/' + report_id);
}	

jQuery(document).ready(function() {
	$('input[placeholder],textarea[placeholder]').placeholder();
	$('#reportName').focus();
	$('#reportName').keypress(function(){
		$('#reportName_placeholder').hide();
	});

	SI.Files.stylizeAll();

	$.get(window.location.pathname + '/receipts', loadReportReceipts);
	$.get(window.location.pathname + '/details', loadReportDetails);

	$('.inputRow:last > td > form.imageForm').ajaxForm();

	$('#save').click(saveReport);
	$('#reimburse').click(function(){
		$.post(window.location.pathname + '/reimburse');
	});
	$('#collect').click(collect);

	$('.inputRow:last > td > form > input:file').change(addRow);
	$('.inputRow > td > input[name="amount"]').keyup(calcTotal);
	$('.inputRow > td > input[name="amount"]').change(calcTotal);
})
