function getJSON(url) {
    return new Promise(function(resolve, reject) {
	var xhr = new XMLHttpRequest();
	xhr.open('get', url, true);
	xhr.responseType = 'json';
	xhr.onload = function() {
	    var status = xhr.status;
	    if (status == 200) {
		resolve(xhr.response);
	    } else {
		reject(status);
	    }
	};
	xhr.send();
    });
};

function initSearchIndex() {
    getJSON('http://0.0.0.0:8500/lunr.idx.json').then(function(data) {
	searchIndex = lunr.Index.load(data);
    }, function(status) { 
	console.log('Unable to load the search index.');
    });
    
    getJSON('http://0.0.0.0:8500/docs.json').then(function(data) {
	pagesIndex = data
    }, function(status) { //error detection....
	console.log('Unable to load docs.');
    });
}

function getLunrSearchQuery(query) {
    const searchTerms = query.split(" ");
    if (searchTerms.length === 1) {
	return query;
    }
    query = "";
    for (const term of searchTerms) {
	query += `+${term} `;
    }
    return query.trim();
}

function getSearchResults(query) {
    return searchIndex.search(query).flatMap((hit) => {
	if (hit.ref == "undefined") return [];
	let pageMatch = pagesIndex.filter((page) => page.idx === parseInt(hit.ref, 10))[0];
	pageMatch.score = hit.score;
	return [pageMatch];
    });
}

function searchSite(query) {
    const originalQuery = query;
    query = getLunrSearchQuery(query);
    let results = getSearchResults(query);
    return results.length
	? results
	: query !== originalQuery
	? getSearchResults(originalQuery)
	: [];
}

function handleSearchQuery(event) {
    console.log('INSIDE DESKTOP SEARCH.');	    
    event.preventDefault();
    const query = document.getElementById("search").value.trim().toLowerCase();
    if (!query) {
	console.log("Please enter a search term");
	return;
    }
    const results = searchSite(query);
    if (!results.length) {
	displayErrorMessage("No results found");
	return;
    }
    renderSearchResults(query, results);
}

function renderSearchResults(query, results) {
    clearSearchResults();
    updateSearchResults(query, results);
    showSearchResults();
    //scrollToTop();
}

function clearSearchResults() {
    const results = document.getElementById("search-cells");
    while (results.firstChild) results.removeChild(results.firstChild);
}


/*
 <div onclick="location.href='#';" style="cursor: pointer;"
     class="bg-white p-5 flex flex-col justify-center items-center rounded-sm shadow-md">
     <img src="./assets/images/minister-1.png" alt="">
     <div class="text-center mt-3.5">
         <h4 class="text-base">Jawaharlal Nehru</h4>
         <p class="text-[11px] text-[#999999]">Tenure: 1947-1964</p>
     </div>
 </div>

*/


function updateSearchResults(query, results) {
    document.getElementById("query").innerHTML = "Search Terms: \"" + query + "\" " + `(${results.length} results)`;
    document.getElementById("search-cells").innerHTML = results
        .map(
            (hit) => `
      <div onclick="location.href='${hit.url}';" style="cursor: pointer;"
        class="bg-white p-5 flex flex-col justify-center items-center rounded-sm shadow-md">
        <img src="${hit.image_url}" class="w-[75px] h-[106px]" alt="${hit.full_name}">        
        <div class="text-center mt-3.5">
            <h4 class="text-base">${hit.full_name}</h4>
            <p class="text-[11px] text-[#999999]">Tenure: ${hit.tenure_str}</p>
       </div>
    </div>
    `
	)
	.join("");
}

function createSearchResultBlurb(query, hit) {
    return `
      <table>
	<tr>
	  <td>
	    <figure>
	      <div class="searchBox">
		<img src="${hit.image_url}">
	      </div>	    
	    </figure>
	  </td>
	  <td>
	    <h4 style="font-family: Tahoma, Geneva, sans-serif;">Key Tenures</h4>
	    <ul>
	      <li><p><b>${hit.key_dept1}</b>&nbsp; ${hit.tenure_str}
	    </ul>
	  </td>
	</tr>
      </table>
      <hr>
      `;
}


/*
  
//      const searchResultListItems = document.querySelectorAll(".search-results ul li");
//      document.getElementById("results-count").innerHTML = searchResultListItems.length;
//      document.getElementById("results-count-text").innerHTML = searchResultListItems.length > 1 ? "results" : "result";
//      searchResultListItems.forEach(
//      (li) => (li.firstElementChild.style.color = getColorForSearchResult(li.dataset.score))
//      );
}
*/            


function showSearchResults() {
    //      document.querySelector(".primary").classList.add("hide-element");
    document.querySelectorAll(".primary").forEach(
	(ar) => (ar.classList.add("hide-element"))
    );
    document.querySelector(".search-results").classList.remove("hide-element");
    //      document.getElementById("site-search").classList.add("expanded");
    //      document.getElementById("clear-search-results-sidebar").classList.remove("hide-element");
}

function hideSearchResults() {
    //  document.getElementById("clear-search-results-sidebar").classList.add("hide-element");
    //  document.getElementById("site-search").classList.remove("expanded");
    document.querySelector(".search-results").classList.add("hide-element");

    document.querySelectorAll(".primary").forEach(
	(ar) => (ar.classList.remove("hide-element"))
    );
    
    //  document.querySelector(".primary").classList.remove("hide-element");
}




function handleClearSearchButtonClicked() {
    console.log('INSIDE MOBILE SEARCH.');	
    hideSearchResults();
    clearSearchResults();
    document.getElementById("search").value = "";
}

function displayErrorMessage(message) {
    document.querySelector(".search-error-message").innerHTML = message;
    document.querySelector(".search-container").classList.remove("focused");
    document.querySelector(".search-error").classList.remove("hide-element");
    document.querySelector(".search-error").classList.add("fade");
}

function removeAnimation() {
    this.classList.remove("fade");
    this.classList.add("hide-element");
    document.querySelector(".search-container").classList.add("focused");
}

function searchBoxFocused() {
    document.querySelector(".search-container").classList.add("focused");
    document
	.getElementById("search")
	.addEventListener("focusout", () => searchBoxFocusOut());
}

function searchBoxFocusOut() {
    document.querySelector(".search-container").classList.remove("focused");
}

function handleMobileSearch(event)
{
    event.preventDefault();
    console.log('INSIDE MOBILE SEARCH.');	
    
    const query = document.getElementById("mobileSearch").value.trim().toLowerCase();
    if (!query) {
	console.log("Please enter a search term");
	return;
    }
    const results = searchSite(query);
    if (!results.length) {
	displayErrorMessage("No results found");
	return;
    }
    renderSearchResults(query, results);
}

initSearchIndex();
document.addEventListener("DOMContentLoaded", function () {
    console.log('DONE INIT.');		    
    if (document.getElementById("search-form") != null) {
	const searchInput = document.getElementById("search");
	searchInput.addEventListener("focus", () => searchBoxFocused());
	searchInput.addEventListener("keydown", (event) => {
	    if (event.keyCode == 13) handleSearchQuery(event);
	});


//	document
//	    .querySelector(".search-error")
//	    .addEventListener("animationend", removeAnimation);
	document
	    .querySelector(".fa-search")
	    .addEventListener("click", (event) => handleSearchQuery(event));
    }

    if (document.getElementById("mobileSearch") != null) {
	const mobileSearchInput = document.getElementById("mobileSearch");
	mobileSearchInput.addEventListener("keydown", (event) => {
    	    if (event.keyCode == 13) handleMobileSearch(event);
	});
    }

    if (document.getElementById("clear-search-results") != null) {
	const button = document.getElementById("clear-search-results");
	button.addEventListener("click", () => handleClearSearchButtonClicked());
    }

    
    // document
    // 	.querySelectorAll("clear-search-results")
    // 	.forEach((button) =>
    // 	    button.addEventListener("click", () => handleClearSearchButtonClicked())
    // 	);
});

const sel_color="bg-white border border-blue-500 lg:border-r-0 relative cursor-pointer text-sm";
const sel_child_color="p-2 w-full h-full min-w-[210px] relative bg-white focus:bg-white z-20 lg:-right-1 -bottom-4 lg:-bottom-0 text-[#333333]";

const unsel_color="bg-[#D9D9D9] border border-[#B8B8B8] border-r-0 cursor-pointer text-sm text-[#333333]";
const unsel_child_color="p-2 w-full h-full  min-w-[210px]";

function updatePanel(idx) {
//    console.log('Inside udpatePane.' + idx + " current: " + current_tenure_idx);

    if (idx == current_tenure_idx){
//	console.log('Same click;')
	return
    }

    click_div = document.getElementById("tenure-" + idx);
    click_child_div = document.getElementById("tenure-child-" + idx);

    prev_click_div = document.getElementById("tenure-" + current_tenure_idx);
    prev_child_div = document.getElementById("tenure-child-" + current_tenure_idx);    

    click_div.className = sel_color;
    click_child_div.className = sel_child_color;

    prev_click_div.className = unsel_color;
    prev_child_div.className = unsel_child_color;

//    console.log('Done updating');
    
    tenure_info = tenure_info_array[idx];
    document.getElementById("rt-ministry").textContent = tenure_info["ministry"];
    document.getElementById("rt-dept").textContent = tenure_info["dept"];
    document.getElementById("rt-role").textContent = tenure_info["role"];    
    document.getElementById("rt-date_str").textContent = tenure_info["date_str"];
    
    document.getElementById("rt-start_order_id").textContent = tenure_info["start_order_id"];
    document.getElementById("rt-end_order_id").textContent = tenure_info["end_order_id"];

//    console.log('Inside udpatePane. before looping' + idx);        

    m_idx = 0;
    for (manager of tenure_info["manager_infos"]){
	document.getElementById("rt-manager-full_name-" + m_idx).textContent = manager["full_name"];
	document.getElementById("rt-manager-image_url-" + m_idx).src = manager["image_url"];
	document.getElementById("rt-manager-role-" + m_idx).textContent = manager["role"];
	document.getElementById("rt-manager-date_str-" + m_idx).textContent = manager["date_str"];
	m_idx += 1;
    }
    current_tenure_idx=idx;
}

function select_language() {
//    console.log("select_language");	      
    var lang_menu = document.getElementById("lang_menu");
    lang = lang_menu.options[ lang_menu.selectedIndex ].value;
    if (lang == "ignore"){
	return;
    }
    
    lang_text = lang_menu.options[ lang_menu.selectedIndex ].text;
    document.getElementById("language-button").textContent = "";
    
    new_url  = lang + '/' + url;
//    console.log("selected: " + lang);	      	      
//    console.log("new_url: " + new_url);	      	      	      
    window.location.assign(new_url);
};
