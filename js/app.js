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
    //queryMovie:null,
    results:[],
    keyword:null,
    movieId:null,
    dataList:null,
    nextPage:null,
    searchOrSuggest:null,
    // obj:null,

    /** variables for the dB */
    DB:null,
    version:2,


  init: () => {
    APP.cards = document.getElementById('cards');
    APP.inputName = document.getElementById('search');
    APP.btnSearch = document.getElementById('btn-search');

    APP.APIKEY = '75789c3f5ba1cec6147292baa65a1ecc';
    APP.urlConfig = `https://api.themoviedb.org/3/configuration?api_key=75789c3f5ba1cec6147292baa65a1ecc`;

    APP.initDb();
    APP.getConfig();    
    APP.addListeners();
    APP.pageSpecific();
   
  },

  addListeners: () => {
  
    APP.btnSearch.addEventListener('click', APP.search);
    APP.cards.addEventListener('click', APP.handleClickMovie);  

  },

  initDb:() => {
    let dbOpenRequest = indexedDB.open('PWAmovieDB', APP.version);


    dbOpenRequest.onupgradeneeded = function (ev) {
      APP.DB = dbOpenRequest.result;
      let searchStore = APP.DB.createObjectStore('searchStore', {keyPath: 'keyword'});
      let suggestedStore = APP.DB.createObjectStore('suggestedStore', {keyPath: 'movieId'});
    };

    dbOpenRequest.onerror = function (err) {
        console.log(err.message);
    };

    dbOpenRequest.onsuccess = function (err) {
      APP.DB = dbOpenRequest.result;
  };

  } ,

  search: (ev) => {
    ev.preventDefault();
    APP.keyword = APP.inputName.value.trim();
    let searchStore = 'searchStore';
    APP.nextPage = `./search-results.html?keyword=${APP.keyword}`;
    APP.searchOrSuggest = 'search';
    if(APP.keyword !== ''){
      // APP.findInDBorFetch(APP.queryMovie);
      // APP.checkInDB(APP.queryMovie);
      APP.checkInDB(APP.keyword, searchStore, APP.decideAfter); 
    }
    else {alert('You did not enter anything')}
  
    APP.inputName.value = '';  
  },

  decideAfter:()=>{
        console.log(APP.results);

        if(APP.results.length === 0){ 
            if(APP.searchOrSuggest === 'search'){
              APP.fetchMovies(APP.keyword)
              console.log('no data in DB we will call fetch movies');
            } else if(APP.searchOrSuggest === 'suggest'){
              APP.fetchSimilarMovies(APP.movieId);
              console.log('no data in DB we will call fetch similar');
            } 
          
        }else{
            console.log('Data found in DB');
            // APP.navigate(`./search-results.html?keyword=${APP.keyword}`);

            APP.navigate(APP.nextPage);
          
        }
  },

  checkInDB:(keyword, store, callBack)=>{
    let tx = APP.DB.transaction(store, 'readwrite');
    tx.onerror = (err) => {
      console.log('failed to successfully run the transaction');
    };
    tx.oncomplete = (ev) => {
      console.log('finished the transaction... wanna do something else');
      callBack();
    };
    let objStore = tx.objectStore(store);
    
    let getRequest = objStore.get(keyword);
    getRequest.onerror = (err) => {
      //error with get request... will trigger the tx.onerror too
    };
    getRequest.onsuccess = (ev) => {
      if(getRequest.result){
        APP.results = getRequest.result.results;
      }
    };
    
  },  

  getResultsFromDB:(keyword) =>{

    let tx = APP.DB.transaction('searchStore', 'readwrite');
  
    tx.onerror = (err) => {
      console.log('failed to successfully run the transaction');
    };
    tx.oncomplete = (ev) => {
      console.log('finished the transaction... wanna do something else');
    };
    let searchStore = tx.objectStore('searchStore');
  
    let searchWord = keyword;
    let getRequest = searchStore.get(searchWord);
    getRequest.onerror = (err) => {
    
    };
    getRequest.onsuccess = (ev) => {
      let result = getRequest.result.results;
      APP.displayMovies(result);
      
    };
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

  // getMovies: (searchString) => {
  //   // let urlMovie =` https://api.themoviedb.org/3/search/movie?api_key=${APP.APIKEY}&query=${searchString}`;
  //   // APP.fetchMovies(urlMovie);

  // },

  fetchMovies: (queryString) => {
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${APP.APIKEY}&query=${queryString}`
    fetch(url)
              .then(response => {
                return response.json();
              }).then(data => {

                console.log(data.results);              
               
                let searchResults = {keyword:queryString, results:data.results};
                console.log(`This is the value of searchResults: ${searchResults}`);
                let searchStore = 'searchStore';
              
                APP.saveToDb(searchResults, searchStore);
                              
              }).catch(err => {
                alert(err);
              })
  },

  saveToDb: (searchResults, store) => {
    let tx = APP.DB.transaction(store, 'readwrite');
    tx.oncomplete = function(ev) {
      
    };
    tx.onerror = function(ev){
      console.log('Can not finish the transaction');
    };
    let movieStore = tx.objectStore(store);
    let addRequest = movieStore.add(searchResults);
    addRequest.onerror = function(err){
      console.warn('Failed to add', err.message);
    };

    addRequest.onsuccess = function(ev){
      console.log(ev.target.result);
      console.log('insertion succeeded');
      // APP.navigate(`./search-results.html?keyword=${APP.keyword}`);
      APP.navigate(APP.nextPage);
    };
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
      
      let url = new URL(window.location.href);
            let params = url.searchParams;
            
            APP.keyword = params.get('keyword');
            console.log(`the keyword is: ${APP.keyword}`);          
            setTimeout(()=>{
              // console.log(APP.DB);
              APP.getResultsFromDB(APP.keyword);
            },1000);            
                
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

  fetchSimilarMovies: (id) => {
  console.log(`inside fetch similar movies the movieId is ${id}`);
  let url =`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${APP.APIKEY}`;
  fetch(url)
  .then(response => {
    return response.json();
  }).then(data => {

    console.log(data.results);              
   
    let searchResults = {movieId:id, results:data.results};
    console.log(`This is the value of searchResults: ${searchResults}`);
   
    let suggestedStore = 'suggestedStore';
    APP.saveToDb(searchResults, suggestedStore);
                  
  }).catch(err => {
    alert(err);
  })

  // fetch(url)
  // .then(response => {
  //   return response.json();
  // }).then(data => {
    
  //   APP.results = data.results;
  
  //   console.log(APP.results);
  //   APP.displayMovies(APP.results);
  
    
    
  // }).catch(err => {
  //   alert('something wrong happened'+ err);
  // })
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
    APP.movieId = ev.target.closest('.card').getAttribute('data-movie-id');
    let suggestedStore = 'suggestedStore';
    APP.nextPage = `./suggested-movies.html?keyword=${APP.keyword}&movieId=${APP.movieId}`;
    APP.searchOrSuggest = 'suggest';
  
  APP.checkInDB(APP.movieId, suggestedStore, APP.decideAfter);
  // APP.navigate(`./suggested-movies.html?keyword=${APP.keyword}&movieId=${movieId}`);

  },


};

APP.init();

