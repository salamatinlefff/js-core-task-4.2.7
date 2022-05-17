class View {
  constructor() {
    this.currentQuery = [];
    this.resultsPerAutocomplete = 5;

    // create layout
    this.app = document.querySelector('.app');

    this.title = this.createElement('h1', 'visually-hidden');
    this.title.textContent = 'Search repositories on github';

    this.searchForm = this.createElement('form', 'search__form');

    this.searchInput = this.createElement('input', 'search__input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'enter your request..';
    this.searchForm.append(this.searchInput);

    this.searchAutocompleteList = this.createElement(
      'ul',
      'search__autocomplete-list'
    );

    this.searchAutocompleteContainer = this.createElement(
      'div',
      'search__autocomplete-container'
    );
    this.searchAutocompleteContainer.append(this.searchAutocompleteList);

    this.appSearch = this.createElement('div', 'app__search');
    this.appSearch.append(this.searchForm, this.searchAutocompleteContainer);

    this.addedRepoList = this.createElement('ul', 'added-repo__list');

    this.appAddedRepo = this.createElement('div', 'app__added-repo');
    this.appAddedRepo.append(this.addedRepoList);

    this.app.append(this.title, this.appSearch, this.appAddedRepo);
  }

  createElement(tagName, className) {
    const element = document.createElement(tagName);
    if (className) element.className = className;

    return element;
  }

  clearSearchInput() {
    this.searchInput.value = '';
  }

  clearAutoCompleteList() {
    if (!this.searchInput.value.trim()) {
      this.searchAutocompleteList.innerHTML = '';
    }
  }

  clearCurrentQuery() {
    this.currentQuery = [];
  }

  renderAutoComplete() {
    this.searchAutocompleteList.innerHTML = '';

    this.currentQuery.forEach((item) => {
      const li = this.createElement('li', 'search__autocomplete-item');
      li.textContent = item.name;

      this.searchAutocompleteList.append(li);
    });
  }

  searchCurrentClick({ target }) {
    for (let i = 0; i < this.currentQuery.length; i += 1) {
      if (target.textContent === this.currentQuery[i].name) {
        this.addRepoItemToList(this.currentQuery[i]);
        break;
      }
    }
  }

  createRepoItem(repoName, ownerName, stars) {
    const repoItem = this.createElement('li', 'added-repo__item');
    repoItem.innerHTML = `
      <ul class="item__repo-list">
        <li class="item__repo-item">
          Name: <span class="item__repo-name">${repoName}</span>
        </li>
        <li class="item__repo-item">
          Owner: <span class="item__repo-owner">${ownerName}</span>
        </li>
        <li class="item__repo-item">
          Starts: <span class="item__repo-stars">${stars}</span>
        </li>
      </ul>

      <button class="item__close-button"></button>
    `;

    return repoItem;
  }

  addRepoItemToList({
    name: repoName,
    owner: { login: ownerName },
    stargazers_count: stars,
  }) {
    const repoItem = this.createRepoItem(repoName, ownerName, stars);

    this.addedRepoList.append(repoItem);
    this.clearSearchInput();
    this.clearAutoCompleteList();
    this.clearCurrentQuery();
  }

  removeRepoItem({ target }) {
    if (target.classList.contains('item__close-button')) {
      let currentItem = target.closest('.added-repo__item');

      currentItem.remove();
    }
  }
}

class Search {
  constructor(view) {
    this.view = view;
  }

  getRepos(query) {
    const BASE = 'https://api.github.com/search';
    const encodeQuery = encodeURIComponent(query);
    const perPage = this.view.resultsPerAutocomplete;
    const url = `${BASE}/repositories?q=${encodeQuery}&per_page=${perPage}`;

    return fetch(url);
  }

  debounce(fn, delay) {
    let timeout;

    return function wrapper(...args) {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }

  async searchRepo() {
    if (this.view.searchInput.value.trim()) {
      const inputValue = this.view.searchInput.value;

      const res = await this.getRepos(inputValue);
      const data = await res.json();
      const repositories = data.items;

      this.view.currentQuery = repositories;

      this.view.renderAutoComplete(repositories);
    }
  }
}

class App {
  constructor(view, search) {
    this.view = view;
    this.search = search;
    this.listeners();
  }

  listeners() {
    this.view.searchForm.addEventListener('submit', (event) =>
      event.preventDefault()
    );

    this.view.searchInput.addEventListener(
      'input',
      this.view.clearAutoCompleteList.bind(this.view)
    );

    this.view.searchInput.addEventListener(
      'focus',
      this.view.renderAutoComplete.bind(this.view)
    );

    this.view.searchInput.addEventListener(
      'keyup',
      this.search.debounce(this.search.searchRepo.bind(this.search), 300)
    );

    this.view.searchAutocompleteList.addEventListener(
      'click',
      this.view.searchCurrentClick.bind(this.view)
    );

    this.view.addedRepoList.addEventListener(
      'click',
      this.view.removeRepoItem.bind(this.view)
    );

    document.body.addEventListener('click', ({ target }) => {
      if (
        target.classList.contains('search__autocomplete-item') ||
        target.classList.contains('search__input')
      ) {
        return;
      }
      this.view.searchAutocompleteList.innerHTML = '';
    });
  }

  get changeResultPerAutocomplete() {
    return this.view.resultsPerAutocomplete;
  }

  set changeResultPerAutocomplete(newCount) {
    return (this.view.resultsPerAutocomplete = newCount);
  }
}

const view = new View();
const search = new Search(view);
const app = new App(view, search);
