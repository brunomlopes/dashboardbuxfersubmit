/* 
 This file was generated by Dashcode.  
 You may edit this file to customize your widget or web page 
 according to the license.txt file included in the project.
 */

// for debug purposes, redefine createInstancePreferenceKey

function createInstancePreferenceKey(key)
{
	return key;
}

var buxferUrl = "https://www.buxfer.com/api/";

var possibleStatus = { UNKNOWN : 0, OK : 5, WARNING : 12, ERROR : 15 };
var xmlHttpRequestTimeout = 30000;

KeyChainAccess.setAppName("Buxfer Widget");

function isFirstTime(){
    if(widget.preferenceForKey(createInstancePreferenceKey("alreadyConfigured")) || false){
        return false;
    }else{
        return true;
    }
}

function setStatus(message, status){
    latestStatusIndicator.object.setValue(status);
    statusText.innerText = message;
}

function setErrorStatusFromRequest(message, request){
    jsonError = JSON.parse(request.responseText);
    setStatus(message + jsonError.response.status, possibleStatus.ERROR);
}
function isResponseStatusOk(xmlRequest)
{
    if (xmlRequest.status == 200) {
        return true;
    }else{
        return false;
    }
}


function loginUser(successCallback)
{
    if ( !(successCallback)){
        successCallback = function(token, uid){};
    }
    setStatus("Logging in...", possibleStatus.WARNING);

    var username = widget.preferenceForKey(createInstancePreferenceKey("username"));
    var password = KeyChainAccess.loadPassword(username); 
    
    // TODO: setup global timeout
    jQuery.ajax({
        type: "GET",
        url: buxferUrl+"login.json",
        dataType : "json",
        data: "userid="+encodeURIComponent(username)+"&password="+encodeURIComponent(password),
        error : function(request, textStatus, errorThrown){
            setErrorStatusFromRequest("Login:", request);
        },
        success : function(data, textStatus){
            setStatus("Login ok", possibleStatus.OK);
            successCallback(data.response.token, data.response.uid);
        }
    });
}

function refreshAccountsList(successCallback)
{
    loginUser(function(token, uid){
	    setStatus("Fetching account list...", possibleStatus.WARNING);
	    
        jQuery.ajax({
            type: "GET",
            url: buxferUrl+"accounts.json",
            dataType : "json",
            data: "token="+token,
            error : function(request, textStatus, errorThrown){
                setErrorStatusFromRequest("Accounts:", request);
            },
            success : function(data, textStatus){
                setStatus("Accounts ok", possibleStatus.OK);
                var accounts = data.response.accounts;
                var accountOptions = [];
            
                for(var i = 0; i < accounts.length; i++){
                    var account = accounts[i];
                    accountOptions[i] = [account.name, account.id];
                }
                setStatus("Ok", possibleStatus.OK);
            
                selectedAccount.object.setOptions(accountOptions);
                selectedAccount.object.setEnabled(true);
                successCallback(accounts);
            }
        });
    });
}

function addTransaction(description, amount, tags, account)
{
    loginUser(function(token, uid){
        setStatus("Adding transaction...", possibleStatus.WARNING);
        
        var text = description + " " + amount;
        
        if(tags && tags != ""){
            text += " tags:" + tags;
        }
        if(account){
            text += " acct:" + account;
        }
        
        var params = "token="+token+"&format=sms&text="+encodeURIComponent(text);
               
        jQuery.ajax({
            type: "POST",
            url: buxferUrl+"add_transaction.json",
            dataType : "json",
            data: params,
            error : function(request, textStatus, errorThrown){
                setErrorStatusFromRequest("Add trans.:", request);
            },
            success : function(data, textStatus){
                jsonResponse = data.response;
                if (jsonResponse.parseStatus != "success"){
                    setStatus("Transaction wasn't parsed correctly...", possibleStatus.WARNING);
                    return;
                }
                if (!jsonResponse.transactionAdded){
                    setStatus("Transaction wasn't added...", possibleStatus.WARNING);
                    return;
                }
                setStatus("Added to "+ (account || " no account"), possibleStatus.OK);
            }
        });
    });
}

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
function load()
{
    dashcode.setupParts();
    if(isFirstTime()){
        showBack(null);
    }else{
        loginUser();
    }
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
    // Stop any timers to prevent CPU usage
    // Remove any preferences as needed
    widget.setPreferenceForKey(null, createInstancePreferenceKey("username"));
    //widget.setPreferenceForKey(null, createInstancePreferenceKey("password"));
    widget.setPreferenceForKey(null, createInstancePreferenceKey("accountId"));
    widget.setPreferenceForKey(null, createInstancePreferenceKey("accountName"));
    widget.setPreferenceForKey(null, createInstancePreferenceKey("alreadyConfigured"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
    // Stop any timers to prevent CPU usage
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{
    // Restart any timers that were stopped on hide
}

//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
    // Retrieve any preference values that you need to be synchronized here
    // Use this for an instance key's value:
    // instancePreferenceValue = widget.preferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
    //
    // Or this for global key's value:
    // globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    front.style.display = "none";
    back.style.display = "block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
    
    loadPreferences();
}

function selectCorrectAccount(accounts){
    var selectedAccountId = widget.preferenceForKey(createInstancePreferenceKey("accountId"));
    if (!(selectedAccountId || false)){
        return;
    }
    for(var i=0; i< accounts.length;i++){
        if (accounts[i].id == selectedAccountId){
            selectedAccount.object.setSelectedIndex(i);
        }
    }
}

function loadPreferences()
{
    //passwordField.value = createInstancePreferenceKey("username") || "";
    usernameField.value = widget.preferenceForKey(createInstancePreferenceKey("username")) || "";
    if(usernameField.value != ""){
        passwordField.value = KeyChainAccess.loadPassword(usernameField.value)
    }

    refreshAccountsList(selectCorrectAccount);
}

function savePreferences()
{
    //var preferenceValue = passwordField.value;
    //widget.setPreferenceForKey(preferenceValue, createInstancePreferenceKey("password"));
    
    var preferenceValue = usernameField.value;
    widget.setPreferenceForKey(preferenceValue, createInstancePreferenceKey("username"));
    if(preferenceValue != ""){
        KeyChainAccess.savePassword(usernameField.value, passwordField.value);
    }
    
    selectedAccountIndex = selectedAccount.object.getSelectedIndex();
    if(selectedAccountIndex == -1){
        widget.setPreferenceForKey(null, createInstancePreferenceKey("accountId"));
        widget.setPreferenceForKey(null, createInstancePreferenceKey("accountName"));
    }else{
        preferenceValue = selectedAccount.object.select.options[selectedAccountIndex].value;
        widget.setPreferenceForKey(preferenceValue, createInstancePreferenceKey("accountId"));
    
        preferenceValue = selectedAccount.object.select.options[selectedAccountIndex].text;
        widget.setPreferenceForKey(preferenceValue, createInstancePreferenceKey("accountName"));
    }
    widget.setPreferenceForKey("aye", createInstancePreferenceKey("alreadyConfigured"));
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display="block";
    back.style.display="none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
    
    savePreferences();
    // try and login the user to make sure the credentials are ok
    loginUser();
}

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
    widget.onsync = sync;
}

function addTransaction_Click(event)
{
    var description = descriptionField.value;
    // perhaps here we could try and use a localization to see what is the decimal sign
    var amount = amountField.value.replace(",",".");
    var tags = tagsField.value;
    var account = widget.preferenceForKey(createInstancePreferenceKey("accountName"));
    addTransaction(description, amount, tags, account);
}


function passwordField_Blur(event)
{
    // save the preferences so that the login function can get the correct username and password
    savePreferences();
    refreshAccountsList(selectCorrectAccount);
}

function tagsField_KeyUp(event)
{
    if(event.keyIdentifier == "Enter"){
        addTransaction_Click();
        return false;
    }
    return true;
}

