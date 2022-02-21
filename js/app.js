/**
 * Student: Vladymir Adam
 * Project 1: PWA - Suggest A Movie
 * mad9022 - 2022 
 */

'use strict';

const APP = {
   /** My global variables */  
    secureBaseUrl: null,
    logoSize: null,
    posterSize: null,
    profileSize: null,
    APIKEY : null,
    cards : null,
    inputName : null,
    urlConfig : `https://api.themoviedb.org/3/configuration?api_key=75789c3f5ba1cec6147292baa65a1ecc`,
    btnSearch: null,
    queryMovie:null,
    results:[],
    keyword:[],


  init: () => {
    APP.cards = document.getElementById('cards');
    APP.inputName = document.getElementById('search');
    APP.btnSearch = document.getElementById('btn-search');

    APP.APIKEY = '75789c3f5ba1cec6147292baa65a1ecc';
    APP.urlConfig = `https://api.themoviedb.org/3/configuration?api_key=75789c3f5ba1cec6147292baa65a1ecc`;

    APP.getConfig();    
    APP.addListeners();
    APP.pageSpecific();
   
  },

  addListeners: () => {
  
    APP.btnSearch.addEventListener('click', APP.search);
    APP.cards.addEventListener('click', APP.handleClickMovie);

   

  },

  search: (ev) => {
    ev.preventDefault();
    APP.queryMovie = APP.inputName.value.trim();
    if(APP.queryMovie !== ''){
      APP.navigate(`http://127.0.0.1:5500/search-results.html?keyword=${APP.queryMovie}`);
      // APP.getMovies(APP.queryMovie);
      
    }
    else {alert('You did not enter anything')}
  
    APP.inputName.value = '';  
  },

  getConfig: () => {
    fetch(APP.urlConfig)
    .then(response => {
      return response.json();
    })
    .then(data => {
      /** I need those info from the configuration fetch to display the images later on */

      // console.log(data);
        APP.secureBaseUrl = data.images.secure_base_url;
        APP.logoSize = data.images.logo_sizes[6];
        APP.posterSize = data.images.poster_sizes[6];
        APP.profileSize = data.images.profile_sizes[1];

        // poster_sizes: (7) ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original']
    
    })
    .catch(err => {
      alert(err);
    })
  },

  getMovies: (searchString) => {
    let urlMovie =` https://api.themoviedb.org/3/search/movie?api_key=${APP.APIKEY}&query=${searchString}`;
    APP.fetchMovies(urlMovie);

  },

  fetchMovies: (url) => {
    fetch(url)
              .then(response => {
                return response.json();
              }).then(data => {
                // APP.actorsArr = data.results;
                // localStorage.setItem(APP.queryActor, JSON.stringify(APP.actorsArr));
                /** The function fetchActor is using the displayCards function to display the info of 
                 * the actors(photo, name and a number of stars emoji based on his popularity)
                 * 
                 */
                // DISPLAY.displayCards(APP.actorsArr, 'actor');
                APP.results = data.results;
                // console.log(data);
                console.log(APP.results);
                APP.displayMovies(APP.results);
              
                
                
              }).catch(err => {
                alert(err);
              })
  },

  navigate: (url) => {
    window.location = url;
  },

  pageSpecific:()=>{
  
    if(document.body.id === 'home'){
        //on the home page
        console.log('We are on the home page');
    }
    if(document.body.id === 'results'){
        //on the results page
        //listener for clicking on the movie card container 
        console.log('we are on the results page');
        let qs = location.search.substring(1);
        let searchParams = new URLSearchParams(qs);
       
        // Display the values
        let i = 0;
        for(let value of searchParams.values()) {
          // console.log(value);
          APP.keyword[i] = value;
          i++;
        }

        console.log(APP.keyword[0]);
        APP.getMovies(APP.keyword[0]);
    }
    if(document.body.id === 'suggest'){
        //on the suggest page
        //listener for clicking on the movie card container 
        console.log('We are on the suggest page');

        let qs = location.search.substring(1);
        let searchParams = new URLSearchParams(qs);
       
        // Display the values
        let i = 0;
        for(let value of searchParams.values()) {
          // console.log(value);
          APP.keyword[i] = value;
          i++;
        }
        //   let val = APP.keyword[1];
        //   parseInt(val);
        // console.log(typeof val);
        // let num = 38575;
        // console.log(Number(val));
        APP.getSimilarMovies(Number(APP.keyword[1]));
        // APP.getSimilarMovies(num);

    }
    if(document.body.id === 'fourohfour'){
        //on the 404 page
        console.log('We are on the 404 page');
    }
},

getSimilarMovies: (movieId) => {
  console.log('inside getSimilarMovies');
  // let urlMovie =` https://api.themoviedb.org/3/search/movie?api_key=${APP.APIKEY}&query=${searchString}`;
  let urlMovie =`https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${APP.APIKEY}`;
  APP.fetchSimilarMovies(urlMovie);
},

fetchSimilarMovies: (url) => {
  console.log('inside fetch similar movies')
  fetch(url)
  .then(response => {
    return response.json();
  }).then(data => {
    // APP.actorsArr = data.results;
    // localStorage.setItem(APP.queryActor, JSON.stringify(APP.actorsArr));
    /** The function fetchActor is using the displayCards function to display the info of 
     * the actors(photo, name and a number of stars emoji based on his popularity)
     * 
     */
    // DISPLAY.displayCards(APP.actorsArr, 'actor');
    APP.results = data.results;
    // console.log(data);
    console.log(APP.results);
    APP.displayMovies(APP.results);
  
    
    
  }).catch(err => {
    alert('something wrong happened'+ err);
  })
},

displayMovies: (arr) => {

  let df = document.createDocumentFragment();

  arr.forEach(item => {
    let posterPath = item.poster_path;
  
    if(posterPath !== null){ 
        let imgPath = APP.secureBaseUrl + APP.posterSize + posterPath; 

        let card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-movie-id', item.id);

        let imgWrap = document.createElement('div');
        imgWrap.classList.add('img-wrap');

        let img = document.createElement('img');
        img.setAttribute('src', imgPath);

        let contentWrap = document.createElement('div');
        contentWrap.classList.add('content-wrap');

        let movieTitle = document.createElement('p');
        movieTitle.textContent = item.title;

        let linkToSimilar = document.createElement('p');
        linkToSimilar.innerHTML = `<span> Similar movies </span>`;


        contentWrap.appendChild(movieTitle);
        contentWrap.appendChild(linkToSimilar);

        imgWrap.appendChild(img);
        card.appendChild(imgWrap);
        card.appendChild(contentWrap);

        df.appendChild(card);
    }
  });
  APP.cards.append(df);
},

handleClickMovie: (ev) => {
  // I need to pass the id of the movie along with the keyword to the suggested-results page
let movieId = ev.target.closest('.card').getAttribute('data-movie-id');
APP.navigate(`http://127.0.0.1:5500/suggested-movies.html?keyword=${APP.keyword[0]}&movieId=${movieId}`);
},


};

APP.init();

