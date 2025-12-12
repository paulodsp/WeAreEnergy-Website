var formURL =
  "https://docs.google.com/forms/d/e/1FAIpQLScF2jcjMfcak-jVHneiFiLMDnUYS2jfTvWHXLbW42bUgPNbWA/formResponse?";
  

sendBtn.onclick = function() {
  var data = {
    "entry.66386698": document.getElementById("entry.66386698").value,
    "entry.413471257": document.getElementById("entry.413471257").value,
    "entry.1199933740": document.getElementById("entry.1199933740").value,
    "entry.799268612": document.getElementById("entry.799268612").value,
    "entry.643330730": document.getElementById("entry.643330730").value,
    /* "entry.1560061539": document.getElementById("entry.1560061539").value */
  };
  $("#form").hide();
  $("#loading").show();
  postToGoogle(formURL, data);
  loadSheet.click("https://weareenergy.coop/thankyou.html");
};


function postToGoogle(googleURL, data) {
  $.ajax({
    url: googleURL,
    data: data,
    type: "POST",
    dataType: "xml",
    statusCode: {
      0: function() {
        //Success message
      },
      200: function() {
        //Success Message
      }
    },

    error: function(){
      // actually throws an error, but does send properly
       $("#bootstrapForm").show();
       $("#loading").hide();
    },
  });
}




