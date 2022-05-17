const shareBtn = document.querySelector('.share-btn');

shareBtn.addEventListener('click', () => {
  if (navigator.share) {
    navigator.share({
      title: 'We Are Energy Co-operative',
      text: "I just signed up to join We Are Energy Co-operative. It Rocks and I think you'll love it too. Find out more and register here to act on #climatechange now and join the green energy revolution.",
      url: 'https://WeAreEnergy.coop'
     })

     .then(() => console.log('Thanks for sharing!'))
     .catch((error) => console.log(`Couldn't share because of`, error));
  } else {
    navigator.clipboard.writeText('https://WeAreEnergy.coop');
    alert("Our Web Address had been copied to your clipboard. As your browser doesn't support this functionality");
    console.log('Web share not supported on your browser at the moment');
  }
})