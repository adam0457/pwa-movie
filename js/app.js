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
    urlConfig : null,
    btnSearch: null,   
    results:[],
    keyword:null,
    movieId:null,
    movieTitle:null,   
    nextPage:null,  
    searchOrSuggest:null,
    theBlob:null,   
    DB:null,
  


  init: () => {
    APP.cards = document.getElementById('cards');
    APP.inputName = document.getElementById('search');
    APP.btnSearch = document.getElementById('btn-search');    

    APP.APIKEY = '75789c3f5ba1cec6147292baa65a1ecc';
    APP.urlConfig = `https://api.themoviedb.org/3/configuration?api_key=75789c3f5ba1cec6147292baa65a1ecc`;

    // APP.registerSW();
    APP.initDb();
    APP.getConfig();    
    APP.addListeners();
    APP.pageSpecific();
  
  },

  // registerSW: () => {
  //   navigator.serviceWorker.register('./sw.js').catch(function (err) {
  //     console.warn(err);
  //   });
  // },

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

  },

  search: (ev) => {
    ev.preventDefault();
    APP.keyword = APP.inputName.value.trim();
    let searchStore = 'searchStore';
    APP.nextPage = `./search-results.html?keyword=${APP.keyword}`;
    APP.searchOrSuggest = 'search';

    if(APP.keyword !== ''){
      
      APP.checkInDB(APP.keyword, searchStore, APP.decideAfter); 
    }
    else {
          // The user didn't enter anything
        let msg = document.getElementById('no-keyword-entered');
        msg.textContent =  `" You have not entered anything "`;
    }
  
    APP.inputName.value = '';  
  },

  /**
   *  This function will make the decision to fetch the movies or the similar movies 
      or navigate to the next page
   */

  decideAfter:()=>{ 
        if(APP.results.length === 0){ 
            if(APP.searchOrSuggest === 'search'){
              APP.fetchMovies(APP.keyword)
            
            } else if(APP.searchOrSuggest === 'suggest'){
              APP.fetchSimilarMovies(APP.movieId);
            
            } 
          
        }else{          

            APP.navigate(APP.nextPage);          
        }
  },

  /**
   *  This function will check in the DB if the keyword is there before doing a fetch 
   */
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

  /**
   * We use this function to retrieve results from the DB after navigating to the search results page
   * or the suggested page
   */
  getResultsFromDB:(keyword, store) =>{

    let tx = APP.DB.transaction(store, 'readwrite');
  
    tx.onerror = (err) => {
      console.log('failed to successfully run the transaction');
    };
    tx.oncomplete = (ev) => {
      console.log('finished the transaction... wanna do something else');
    };
    let searchStore = tx.objectStore(store);
  
    let searchWord = keyword;
    let getRequest = searchStore.get(searchWord);
    getRequest.onerror = (err) => {
    
    };
    getRequest.onsuccess = (ev) => {
      if(getRequest.result){
        let result = getRequest.result.results;
        APP.displayResults(result);
      }
      
      
    };
  },   

  /**
   * I use the getConfig function to get the basic configuration from the TMDB API
   */
  getConfig: () => {
    fetch(APP.urlConfig)
    .then(response => {
      return response.json();
    })
    .then(data => {
      /** I need those info from the configuration fetch to display the images later on */

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

  /**
   *  I fetch the movies, I create an array of images from the response and I put 
   *  the results in the DB and the images in the cacheImages 
   */

  fetchMovies: (queryString) => {
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${APP.APIKEY}&query=${queryString}`
    fetch(url)
              .then(response => {
                return response.json();
              }).then(data => {                          
              
                let searchResults = {keyword:queryString, results:data.results};
                let searchStore = 'searchStore';
                let images =  APP.createArrImages(data.results); 
                              
                APP.putInCacheAndDB(images, searchResults, searchStore );                
                              
              }).catch(err => {
              
                APP.navigate('/404.html');
              })
  },

  /**
   *  This is the method that will put the images in the cache and call the saveToDb method 
   *  to put the data in the DB
   */

  putInCacheAndDB: async (images, searchResults, store)=>{
        let response = await caches.open('imagesCache');
        let cache = await response.addAll(images);
        APP.saveToDb(searchResults, store);
  },

  /**
   *  This is to create an array of images from the fetch
   */

  createArrImages:(data)=>{
  
      let moviesWithPoster = data.filter((element) => element.poster_path !== null);
      let ArrImages = moviesWithPoster.map(movie => {
        
            let poster = APP.secureBaseUrl + APP.posterSize + movie.poster_path;
            return poster;        
    })

    return ArrImages;
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
            let searchStore = 'searchStore';
            
            let showResults = document.getElementById('show-results');
            showResults.textContent = ` "${APP.keyword}"`; 

          // I use a setTimeout to wait the DB to load after navigating to this page
          // before retrieving the data  

            setTimeout(()=>{            
              APP.getResultsFromDB(APP.keyword, searchStore);
            },300);            
                
    }
    if(document.body.id === 'suggest'){
        console.log('We are on the suggest page');

        let url = new URL(window.location.href);
            let params = url.searchParams;
            
            APP.movieId = params.get('movieId');
            APP.movieTitle = params.get('movieTitle');

            let showSimilar = document.getElementById('show-similar');
            showSimilar.textContent = ` "${APP.movieTitle}"`;  
            
          
            let suggestedStore = 'suggestedStore';

             // I use a setTimeout to wait the DB to load after navigating to this page
          // before retrieving the data  

            setTimeout(()=>{
              APP.getResultsFromDB(APP.movieId, suggestedStore);
            },1000);   
          
    }
    if(document.body.id === 'fourohfour'){
      let searchStore = 'searchStore';
        setTimeout(()=>{
          APP.getPreviousKeywords(searchStore);
        },300); 
    }
  },

  /**
   *  This function is to get the previous keywords when the user is offline and we want to propose other
   *  options
   */

  getPreviousKeywords:(store)=>{
    let tx = APP.DB.transaction(store, 'readwrite');
  
    tx.onerror = (err) => {
      console.log('failed to successfully run the transaction');
    };
    tx.oncomplete = (ev) => {
      console.log('finished the transaction... wanna do something else');
    };
    let searchStore = tx.objectStore(store);  
    
    let getRequest = searchStore.getAll();
    getRequest.onerror = (err) => {
    
    };
    getRequest.onsuccess = (ev) => {
      if(getRequest.result.length > 0){
        let result = getRequest.result;
        APP.showPreviousSearch(result);
      }
      
    };
  },

  /** This is to display the previous keywords */

  showPreviousSearch:(arr)=>{
    let prevKeywords = document.getElementById('previous-keywords');
    let msg =  document.createElement('p');
    msg.textContent = "Here are some other keywords that you have used in the past:";
    prevKeywords.appendChild(msg);
    let listSearch = document.createElement('ul');
    listSearch.addEventListener('click', APP.clickPreviousKeyword);
    let df = document.createDocumentFragment();

    arr.forEach(search => {
        let li = document.createElement('li');
        li.setAttribute('data-keyword', search.keyword);
        li.innerHTML = ` "${search.keyword}" ` ;
        df.appendChild(li);
    })
    listSearch.appendChild(df);
    prevKeywords.appendChild(listSearch);
  

  },

  /** When the user clicks a previous keyword from the 404 page */

  clickPreviousKeyword:(ev)=>{
    APP.keyword = ev.target.closest('li').getAttribute('data-keyword');
    APP.nextPage = `./search-results.html?keyword=${APP.keyword}`;
    APP.navigate(APP.nextPage);
  },

  /** This is to fetch similar movies, put images in cache and store results in DB */

  fetchSimilarMovies: (id) => {
  
  let url =`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${APP.APIKEY}`;
  fetch(url)
  .then(response => {
    return response.json();
  }).then(data => {
      
      let searchResults = {movieId:id, results:data.results};
  
    let suggestedStore = 'suggestedStore';
    let images =  APP.createArrImages(data.results); 
    APP.putInCacheAndDB(images, searchResults, suggestedStore );
  
  }).catch(err => {
  
    APP.navigate('/404.html');
  })


  },

  /** This is to build the cards for displaying the movies  */

  buildPosterCards:async(arr, i, df)=>{

    let options = {
      ignoreSearch: true, //ignore the queryString
      ignoreMethod: true, //ignore the method - POST, GET, etc
      ignoreVary: false, //ignore if the response has a VARY header
    };

    /**
     * I could have used a loop but it goes too fast when I'm taking the images from the cache
     * so I use this if statement and I call the same function again
     */

    let item = arr[i];
    let posterPath = null;
    if(item){
      posterPath = item.poster_path;
    }
  

      if(posterPath !== null){ 
          let imgPath = APP.secureBaseUrl + APP.posterSize + posterPath;
        
          let response = await caches.match(imgPath, options);
        
          APP.theBlob = await response.blob();
        
          let card = document.createElement('div');
          card.classList.add('card');          
          card.setAttribute('data-movie-id', item.id);
          card.setAttribute('data-movie-title', item.title);
          let imgWrap = document.createElement('div');
          imgWrap.classList.add('img-wrap');

          let url = URL.createObjectURL(APP.theBlob);
          let img = document.createElement('img');
        
          img.setAttribute('src', url);
          let contentWrap = document.createElement('div');
          contentWrap.classList.add('content-wrap');

          let movieTitle = document.createElement('h3');
          movieTitle.textContent = item.title;
        
          let releaseDate = document.createElement('h3');
          releaseDate.textContent = `Release Date: ${item.release_date}`;


          contentWrap.appendChild(movieTitle);        
          contentWrap.appendChild(releaseDate);

          imgWrap.appendChild(img);
          card.appendChild(imgWrap);
          card.appendChild(contentWrap);

          df.appendChild(card);
          APP.cards.append(df);

          i++;
          if(i <= arr.length){
            APP.buildPosterCards(arr,i, df)
          }
      }else{
          i++;
          if(i <= arr.length){
          APP.buildPosterCards(arr,i, df)
        }
      }
    
  },

  buildPosterCardsTest:async(arr, i, df)=>{

    let options = {
      ignoreSearch: true, //ignore the queryString
      ignoreMethod: true, //ignore the method - POST, GET, etc
      ignoreVary: false, //ignore if the response has a VARY header
    };

    /**
     * I could have used a loop but it goes too fast when I'm taking the images from the cache
     * so I use this if statement and I call the same function again
     */

    let item = arr[i];
    let posterPath = null;
    if(item){
      posterPath = item.poster_path;
    }
  

      if(posterPath !== null){ 
          let imgPath = APP.secureBaseUrl + APP.posterSize + posterPath;
        
          let response = await caches.match(imgPath, options);
        
          APP.theBlob = await response.blob();

          let scene = document.createElement('div');
          scene.classList.add('scene');
        
          let card = document.createElement('div');
          card.classList.add('flip-card');          
          card.setAttribute('data-movie-id', item.id);
          card.setAttribute('data-movie-title', item.title);

          let front = document.createElement('div');
          front.classList.add('card__face','card__face--front');

          let back = document.createElement('div');
          back.classList.add('card__face', 'card__face--back');

          let descriptionWrap = document.createElement('div');
          descriptionWrap.classList.add('description-wrap');


          let flipBtn = document.createElement('button');
          flipBtn.classList.add('button-flip');
          flipBtn.textContent = 'Back';
        
          let flipBtn2 = document.createElement('button');
          flipBtn2.classList.add('button-flip');
          flipBtn2.textContent = 'Front';
            

          let description = document.createElement('h3');
          description.textContent = item.overview;

          let imgWrap = document.createElement('div');
          imgWrap.classList.add('img-wrap');

          let url = URL.createObjectURL(APP.theBlob);
          let img = document.createElement('img');
        
          img.setAttribute('src', url);
          let contentWrap = document.createElement('div');
          contentWrap.classList.add('content-wrap');

          let movieTitle = document.createElement('h3');
          movieTitle.textContent = item.title;
        
          let releaseDate = document.createElement('h3');         
          releaseDate.textContent = `Release Date: ${item.release_date}`;


          contentWrap.appendChild(movieTitle);        
          contentWrap.appendChild(releaseDate);

          descriptionWrap.appendChild(description);

          imgWrap.appendChild(img);
          front.appendChild(imgWrap);
          front.appendChild(contentWrap)          
          front.appendChild(flipBtn);
          back.appendChild(descriptionWrap);
          back.appendChild(flipBtn2);

          card.appendChild(front);         
          card.appendChild(back);

          scene.appendChild(card);
        
          df.appendChild(scene);
          APP.cards.append(df);

          i++;
          if(i <= arr.length){
            APP.buildPosterCardsTest(arr,i, df)
          }
      }else{
          i++;
          if(i <= arr.length){
          APP.buildPosterCardsTest(arr,i, df)
        }
      }
    
  },

  /** For displaying the movies */

  displayResults:(arr)=>{
    let df = document.createDocumentFragment();
    if(arr.length > 0){
      let i = 0;
      // APP.buildPosterCards(arr,i, df) 
      console.log(arr);
      APP.buildPosterCardsTest(arr,i, df) 
    }else{
      let msg = document.getElementById('no-results');
      msg.textContent = `" No results found " `;
      
    }
  
  },


  /** When the user clicks on a movie */

  handleClickMovie: (ev) => {
      console.log(ev.target.nodeName);
      if(ev.target.nodeName === 'BUTTON'){

        console.log(ev.target.closest('.flip-card'));
        ev.target.closest('.flip-card').classList.toggle('is-flipped');

      }else {

            // I need to pass the id of the movie along with the keyword to the suggested-results page
          APP.movieId = ev.target.closest('.flip-card').getAttribute('data-movie-id');
          APP.movieTitle = ev.target.closest('.flip-card').getAttribute('data-movie-title');
          let suggestedStore = 'suggestedStore';
          
          APP.nextPage = `./suggested-movies.html?movieId=${APP.movieId}&movieTitle=${APP.movieTitle}`;
          APP.searchOrSuggest = 'suggest';
        
          APP.checkInDB(APP.movieId, suggestedStore, APP.decideAfter);

      }    

  },


};

APP.init();

