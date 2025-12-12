var formURL =
  "https://docs.google.com/forms/d/e/1FAIpQLScF2jcjMfcak-jVHneiFiLMDnUYS2jfTvWHXLbW42bUgPNbWA/formResponse?";
  
var sendBtn = document.getElementById("sendBtn");
var formEl  = document.getElementById("form");

sendBtn.onclick = function() {
  // This adds the “ticks” / Bootstrap validation feedback
  if (!formEl.checkValidity()) {
    formEl.classList.add("was-validated");
    return;
  }
  var data = {
    "entry.66386698": document.getElementById("entry.66386698").value,
    "entry.413471257": document.getElementById("entry.413471257").value,
    "entry.1199933740": document.getElementById("entry.1199933740").value,
    "entry.799268612": document.getElementById("entry.799268612").value,
    "entry.643330730": document.getElementById("entry.643330730").value,
  };
  $("#form").hide();
  $("#loading").show();
  postToGoogle(formURL, data);
  window.location.href = "https://weareenergy.coop/thankyou.html";
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
       $("#form").show();
       $("#loading").hide();
    },
  });
}




