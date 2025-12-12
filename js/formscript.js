var formURL =
  "https://docs.google.com/forms/d/e/1FAIpQLScF2jcjMfcak-jVHneiFiLMDnUYS2jfTvWHXLbW42bUgPNbWA/formResponse?";

var sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = function () {
  var formEl = document.getElementById("form");

  // HTML5 + Bootstrap-style validation
  if (!formEl.checkValidity()) {
    formEl.classList.add("was-validated");
    return; // do not send if invalid
  }

  var data = {
    "entry.66386698": document.getElementById("66386698").value,
    "entry.413471257": document.getElementById("413471257").value,
    "entry.1199933740": document.getElementById("1199933740").value,
    "entry.799268612": document.getElementById("799268612").value,
    "entry.643330730": document.getElementById("643330730").value
  };

  $("#form").hide();
  $("#loading").show();

  postToGoogle(formURL, data);

  // Redirect to thank-you page; Google receives the POST via AJAX
  window.location.href = "https://weareenergy.coop/thankyou.html";
};

function postToGoogle(googleURL, data) {
  $.ajax({
    url: googleURL,
     data,
    type: "POST",
    dataType: "xml",
    statusCode: {
      0: function () {
        // Success (Google often gives 0 because of CORS)
      },
      200: function () {
        // Success
      }
    },
    error: function () {
      // Even on error, Google usually stores the response
      $("#form").show();
      $("#loading").hide();
    }
  });
}
