// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, Element, forceUpdate, h, Host, Method, Prop, State, Watch } from "@stencil/core";
import { getLayoutClass, resolveLayoutAuto, ViewLayout } from "../data/breakpoints";
import { LanguageDataService } from "../data/language/language-data-service";
import { StencilComponent } from "../utils/StencilComponent";
import { TravelTimesDataService } from "../data/travel-times/travel-times-data-service";
import { TravelTimesShort, TravelTimesSource, TravelTimesVehicleType } from "../data/travel-times/TravelTimesShort";
import { Subscription } from "../utils/TimerWatcher";
import { formatDateTime } from "../utils/date";

/**
 * Traffic forecast component
 *
 * @part title - Title
 * @part content - Content
 * @part footer - Footer
 */
@Component({
  tag: 'noi-a22-travel-times',
  styleUrl: 'a22-travel-times.css',
  shadow: true,
})
export class A22TravelTimesComponent implements StencilComponent {

  /**
   * Language
   */
  @Prop({mutable: true})
  language = 'en';

  /**
   * Vehicle type
   */
  @Prop({mutable: true})
  vehicleType: TravelTimesVehicleType = 'light';

  /**
   * Source type
   */
  @Prop({mutable: true})
  sourceType: TravelTimesSource = 'tollgate';

  /**
   * Layout appearance
   */
  @Prop({mutable: true})
  layout: ViewLayout = 'auto';

  /**
   * Data reload interval
   */
  @Prop({mutable: true})
  reloadInterval: number = 600000;

  @State()
  layoutResolved!: ViewLayout; // force not null because it's initialized immediately

  @Element() el!: HTMLElement;

  _travelTimesData: TravelTimesShort[] = [];

  dataSub: Subscription | null = null;
  sizeObserver: ResizeObserver | null = null;

  // note: services are overridden in tests
  travelTimesDataService: TravelTimesDataService;
  languageService: LanguageDataService;

  constructor() {
    this._renderTableCell = this._renderTableCell.bind(this);
    this._onLanguageChanged = this._onLanguageChanged.bind(this);

    this.travelTimesDataService = new TravelTimesDataService();
    this.languageService = LanguageDataService.getInstance();
  }

  connectedCallback() {
    this.languageService.onLanguageChange.bind(this._onLanguageChanged);
    this.languageService.useLanguage(this.language);

    this._recalculateLayoutClass();
    this._watchSize();
    this.refreshData();
  }

  disconnectedCallback() {
    this._unwatchSize();
    this.languageService.onLanguageChange.unbind(this._onLanguageChanged);
  }

  _onLanguageChanged() {
    forceUpdate(this.el);
  }

  @Watch('language')
  onLanguageChange() {
    return this.languageService.useLanguage(this.language);
  }

  @Watch('layout')
  _recalculateLayoutClass() {
    this.layoutResolved = resolveLayoutAuto(this.el.offsetWidth, this.layout);
  }

  @Watch('reloadInterval')
  reloadIntervalChanged() {
    this.refreshData();
  }

  /**
   * Reload traffic data
   */
  @Method()
  async refreshData() {
    // re-subscribe to data source
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
    this.dataSub = this.travelTimesDataService.getTravelTimesWatcher(this.reloadInterval)
      .subscribe(r => {
        this._travelTimesData = r;
        forceUpdate(this.el);
      });
  }

  _watchSize() {
    if (typeof window.ResizeObserver === 'function') {
      this.sizeObserver = new ResizeObserver(() => {
        this._recalculateLayoutClass();
      });
      this.sizeObserver.observe(this.el);
    } else {
      console.warn('ResizeObserver is not supported');
    }
  }

  _unwatchSize() {
    if (this.sizeObserver) {
      this.sizeObserver.unobserve(this.el);
      this.sizeObserver = null;
    }
  }

  changeVehicleType(e: CustomEvent) {
    const isHeavyVehicle = e.detail.checked;
    this.vehicleType = isHeavyVehicle ? 'heavy' : 'light';
  }

  changeSourceType(e: CustomEvent) {
    const isTvcc = e.detail.checked;
    this.sourceType = isTvcc ? 'tvcc' : 'tollgate';
  }

  setVehicleType(type: TravelTimesVehicleType) {
    this.vehicleType = type;
  }

  setSourceType(type: TravelTimesSource) {
    this.sourceType = type;
  }

  render() {
    const sourceType = this.sourceType === 'tvcc' ? 'tvcc' : 'tollgate'; // protect from invalid value
    const data = this._travelTimesData.filter(tt => tt.source === sourceType);
    return (
      <Host class={getLayoutClass(this.layoutResolved)}>
        {this._renderTitle()}
        <div class="layout__scroll" part="scroll">
          <div class="layout__center" part="content">
            {data.map(this._renderTableCell)}
          </div>
          <div class="layout__spacer"></div>
        </div>
        {this._renderFooter()}
      </Host>
    );
  }

  _renderTableCell(info: TravelTimesShort) {
    const southData = info.south?.[this.vehicleType === 'light' ? 'lightVehicle' : 'heavyVehicle'];
    const northData = info.north?.[this.vehicleType === 'light' ? 'lightVehicle' : 'heavyVehicle'];
    return (<div class="row">
      <div class="row__name">{info.name}</div>
      <div class="row__traffic-level">
        <noi-traffic-level-box level={southData?.level}></noi-traffic-level-box>
        {(southData?.date ? <noi-icon name="access_time"></noi-icon> : null)}
        {(southData?.date ? <div>{formatDateTime(southData.date)}</div> : null)}

        <div class="row__placeholder"></div>
        <div class="title title--row-direction">
          <noi-icon class="title__icon" name="arrow_downward"></noi-icon>
          <div class="title__text">{this.languageService.translate('app.direction.south')}</div>
        </div>
      </div>
      <div class="row__traffic-level">
        <noi-traffic-level-box level={northData?.level}></noi-traffic-level-box>
        {(northData?.date ? <noi-icon name="access_time"></noi-icon> : null)}
        {(northData?.date ? <div>{formatDateTime(northData.date)}</div> : null)}

        <div class="row__placeholder"></div>
        <div class="title title--row-direction">
          <noi-icon class="title__icon" name="arrow_upward"></noi-icon>
          <div class="title__text">{this.languageService.translate('app.direction.north')}</div>
        </div>
      </div>
    </div>);
  }

  _renderTitle() {
    return (<div class="layout__title" part="title">
      <div class="row row--no-border">
        <div class="row__name title__wrapper">

          <div class="title">
            <noi-icon class="title__icon" name="location_on"></noi-icon>
            <span class="title__text">{this.languageService.translate('app.title')}</span>
          </div>

          <div class="title-select">
            <noi-icon name="vehicle" class={'vehicle--' + this.vehicleType}></noi-icon>
            <div class={this.vehicleType === 'light' ? 'option selected-light' : 'option'}
                 onClick={() => this.setVehicleType('light')}>
              {this.languageService.translate('app.vehicle.light')}
            </div>
            <noi-toggle class="vehicle"
                        checked={this.vehicleType === 'heavy'}
                        onNoiChange={e => this.changeVehicleType(e)}></noi-toggle>
            <div class={this.vehicleType === 'heavy' ? 'option selected-heavy' : 'option'}
                 onClick={() => this.setVehicleType('heavy')}>
              {this.languageService.translate('app.vehicle.heavy')}
            </div>
          </div>

            <div class="title-select">
              <div class={this.sourceType === 'tollgate' ? 'option selected' : 'option'}
                   onClick={() => this.setSourceType('tollgate')}>
                {this.languageService.translate('app.source.tollgate')}
              </div>
              <noi-toggle checked={this.sourceType === 'tvcc'}
                          onNoiChange={e => this.changeSourceType(e)}></noi-toggle>
              <div class={this.sourceType === 'tvcc' ? 'option selected' : 'option'}
                   onClick={() => this.setSourceType('tvcc')}>
                {this.languageService.translate('app.source.tvcc')}
              </div>
          </div>
      </div>

      <div class="title title--header-direction">
        <noi-icon class="title__icon" name="arrow_downward"></noi-icon>
        <div class="title__text">{this.languageService.translate('app.direction.south')}</div>
      </div>
      <div class="title title--header-direction">
        <noi-icon class="title__icon" name="arrow_upward"></noi-icon>
        <div class="title__text">{this.languageService.translate('app.direction.north')}</div>
      </div>
    </div>
  </div>)
    ;
  }

  _renderFooter() {
    return (<div class="layout__footer" part="footer">
      <div class="legend">
        <noi-traffic-level-box class="legend__item" level="1">
          <div class="legend__item-content">{this.languageService.translate('app.traffic.regular')}</div>
        </noi-traffic-level-box>
        <noi-traffic-level-box class="legend__item" level="2">
          <div class="legend__item-content">{this.languageService.translate('app.traffic.light')}</div>
        </noi-traffic-level-box>
        <noi-traffic-level-box class="legend__item" level="3">
          <div class="legend__item-content">{this.languageService.translate('app.traffic.severe')}</div>
        </noi-traffic-level-box>
        <noi-traffic-level-box class="legend__item" level="4">
          <div class="legend__item-content">{this.languageService.translate('app.traffic.heavy')}</div>
        </noi-traffic-level-box>
        <noi-traffic-level-box class="legend__item" level="5">
          <div class="legend__item-content">{this.languageService.translate('app.traffic.critical')}</div>
        </noi-traffic-level-box>
        <noi-traffic-level-box class="legend__item" level="-1">
          <div class="legend__item-content">{this.languageService.translate('app.traffic.none')}</div>
        </noi-traffic-level-box>
      </div>
    </div>);
  }


}
