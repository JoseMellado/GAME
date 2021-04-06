import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EndpointsService } from 'src/app/services/endpoints/endpoints.service';
import { environment } from 'src/environments/environment';
import { StoreQueryService } from 'src/app/services/logger/store-query.service';
import { GameService } from 'src/app/services/game/game.service';

@Component({
  selector: 'app-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css'],
})
export class SearchResultComponent implements OnInit {
  query: string;
  domain: string;
  documents = [];
  searching: boolean;
  BaseUrl = environment.serverRoot;
  constructor(
    protected endpointsService: EndpointsService,
    private route: ActivatedRoute,
    public gameService: GameService,
    public router: Router,
    private storeQueryService: StoreQueryService
  ) {}

  ngOnInit(): void {
    this.searching = true;
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.query = params.get('query');
      this.domain = params.get('domain');
    });
    this.endpointsService
      .getDocuments(this.query, this.domain)
      .subscribe(
        (data: []) => {
          // Success
          this.documents = data;
          this.documents = this.endpointsService.sort(this.documents, this.gameService.challenge._id)
          this.searching = false;
        },
        (error) => {
          console.error(error);
        }
      );
  }

  search() {
    if (this.query !== '') {
      let queryData = {
        query: this.query,
        title: document.title,
        url: this.router.url,
        localTimeStamp: Date.now(),
      };
      this.storeQueryService.postQuery(queryData);
      this.router
        .navigate(['/session'], { skipLocationChange: true })
        .then(() =>
          this.router.navigate([
            'session/search-result',
            this.query,
            this.domain,
          ])
        );
    }
  }

  getParameterByName(url, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
      results = regex.exec(url);
    return results === null
      ? ''
      : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  getThumbnail(youtubeUrl) {
    let thumb = this.getParameterByName(youtubeUrl, 'v');
    let thumbUrl = 'http://img.youtube.com/vi/' + thumb + '/default.jpg';
    return thumbUrl;
  }

  showShortDescription(description, num) {
    return description.substr(0, num);
  }
}
