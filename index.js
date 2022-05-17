class View {
  constructor() {
    this.currentQuery = [];
    this.resultsPerAutocomplete = 5;

    // create layout
    this.app = document.querySelector('.app');

    this.title = this.createElement('h1', 'visually-hidden');
    this.title.textContent = 'Поиск репозиториев';

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

    this.searchForm.addEventListener('submit', (event) =>
      event.preventDefault()
    );

    this.searchInput.addEventListener(
      'input',
      this.clearAutoCompleteList.bind(this)
    );

    this.searchAutocompleteList.addEventListener(
      'click',
      this.searchCurrentClick.bind(this)
    );

    this.addedRepoList.addEventListener(
      'click',
      this.removeRepoItem.bind(this)
    );
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

  renderAutoComplete(allSearchResults) {
    const { items: repositories = [] } = allSearchResults;

    this.currentQuery = repositories.slice(0, this.resultsPerAutocomplete);

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

    this.view.searchInput.addEventListener(
      'keyup',
      this.debounce(this.searchRepo.bind(this), 300)
    );
  }

  getRepos(query) {
    const BASE = 'https://api.github.com/search';
    const encodeQuery = encodeURIComponent(query);
    const url = `${BASE}/repositories?q=${encodeQuery}`;

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

      this.view.renderAutoComplete(data);
    }
  }
}

class App {
  constructor(view, search) {
    this.view = view;
    this.search = search;
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
