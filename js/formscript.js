var formURL =
  "https://docs.google.com/forms/d/e/1FAIpQLScF2jcjMfcak-jVHneiFiLMDnUYS2jfTvWHXLbW42bUgPNbWA/formResponse?";

document.addEventListener("DOMContentLoaded", function () {
  var sendBtn = document.getElementById("sendBtn");
  var formEl  = document.getElementById("form");

  if (!sendBtn || !formEl) {
    return;
  }

  sendBtn.onclick = function () {
    // 1. HTML5 + Bootstrap validation
    if (!formEl.checkValidity()) {
      formEl.classList.add("was-validated");
      console.log("Form invalid – not posting");
      return;
    }

    // 2. Build data exactly as Google expects
    var data = {
      "entry.66386698": document.getElementById("66386698").value,
      "entry.413471257": document.getElementById("413471257").value,
      "entry.1199933740": document.getElementById("1199933740").value,
      "entry.799268612": document.getElementById("799268612").value,
      "entry.643330730": document.getElementById("643330730").value
    };
    console.log("About to post to Google", data);

    // 3. UI state + POST + redirect
    $("#form").hide();
    $("#loading").show();
    postToGoogle(formURL, data);

    window.location.href = "https://weareenergy.coop/thankyou.html";
  };
});

function postToGoogle(googleURL, data) {
  console.log("postToGoogle called");
  $.ajax({
    url: googleURL,
     data,
    type: "POST",
    dataType: "xml",
    statusCode: {
      0: function () {
        // Success
      },
      200: function () {
        // Success
      }
    },
    error: function (xhr, status, error) {
      console.log("AJAX error", status, error);
      $("#form").show();
      $("#loading").hide();
    }
  });
}
