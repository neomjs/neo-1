import Base            from '../../component/Base.mjs';
import ClassSystemUtil from '../../util/ClassSystem.mjs';
import Store           from '../../data/Store.mjs';

/**
 * @class Neo.component.wrapper.GoogleMaps
 * @extends Neo.component.Base
 */
class GoogleMaps extends Base {
    /**
     * false hides the default fullscreen control
     * @member {Boolean} fullscreenControl=true
     */
    fullscreenControl = true
    /**
     * @member {Object} markerStoreConfig=null
     */
    markerStoreConfig = null
    /**
     * Pass any options to the map instance which are not explicitly defined here
     * @member {Object} mapOptions={}
     */
    mapOptions = {}
    /**
     * null => the maximum zoom from the current map type is used instead
     * @member {Number|null} maxZoom=null
     */
    maxZoom = null
    /**
     null => the minimum zoom from the current map type is used instead
     * @member {Number|null} minZoom=null
     */
    minZoom = null
    /**
     * false hides the default zoom control
     * @member {Boolean} zoomControl=true
     */
    zoomControl = true

    static getConfig() {return {
        /**
         * @member {String} className='Neo.component.wrapper.GoogleMaps'
         * @protected
         */
        className: 'Neo.component.wrapper.GoogleMaps',
        /**
         * Specify lat & lng for the current focus position
         * @member {Object} center_={lat: -34.397, lng: 150.644}
         */
        center_: {lat: -34.397, lng: 150.644},
        /**
         * Prefer to use markerStoreConfig instead.
         * @member {Neo.data.Store|Object} markerStore_
         * @protected
         */
        markerStore_: {
            model: {
                fields: [{
                    name: 'id',
                    type: 'String'
                }, {
                    name: 'position',
                    type: 'Object'
                }, {
                    name: 'title',
                    type: 'String'
                }]
            }
        },
        /**
         * @member {Number} zoom_=8
         */
        zoom_: 8
    }}

    /**
     * @param {Object} config
     */
    construct(config) {
        super.construct(config);

        let me = this;

        me.addDomListeners({
            googleMapZoomChange: me.onMapZoomChange,
            googleMarkerClick  : me.parseMarkerClick,
            local              : false,
            scope              : me
        })
    }

    /**
     * @param {Object} data
     * @param {String} data.id
     * @param {String} data.mapId
     * @param {Object} data.position
     * @param {String} [data.title]
     */
    addMarker(data) {
        Neo.main.addon.GoogleMaps.addMarker({
            appName: this.appName,
            ...data
        });
    }

    /**
     * Triggered after the center config got changed
     * @param {Object} value
     * @param {Object} oldValue
     * @protected
     */
    afterSetCenter(value, oldValue) {
        if (oldValue !== undefined) {
            Neo.main.addon.GoogleMaps.setCenter({
                appName: this.appName,
                id     : this.id,
                value
            })
        }
    }

    /**
     * Triggered after the markerStore config got changed
     * @param {Object} value
     * @param {Object} oldValue
     * @protected
     */
    afterSetMarkerStore(value, oldValue) {
        let me = this;

        value.on({
            load : me.onMarkerStoreLoad,
            scope: me
        });

        if (value.items.length > 0) {
            me.onMarkerStoreLoad();
        }
    }

    /**
     * Triggered after the mounted config got changed
     * @param {Boolean} value
     * @param {Boolean} oldValue
     * @protected
     */
    afterSetMounted(value, oldValue) {
        let me = this;

        if (value === false && oldValue !== undefined) {
            me.removeMap();
        }

        super.afterSetMounted(value, oldValue);

        if (value) {
            let opts = {
                appName          : me.appName,
                center           : me.center,
                fullscreenControl: me.fullscreenControl,
                id               : me.id,
                mapOptions       : me.mapOptions,
                maxZoom          : me.maxZoom,
                minZoom          : me.minZoom,
                zoom             : me.zoom,
                zoomControl      : me.zoomControl
            };

            setTimeout(() => {
                Neo.main.addon.GoogleMaps.create(opts).then(() => {
                    me.onComponentMounted();
                });
            }, 50);
        }
    }

    /**
     * Triggered after the zoom config got changed
     * @param {Number} value
     * @param {Number} oldValue
     * @protected
     */
    afterSetZoom(value, oldValue) {
        if (oldValue !== undefined) {
            let me = this;

            Neo.main.addon.GoogleMaps.setZoom({
                appName: me.appName,
                id     : me.id,
                value
            });

            me.fire('zoomChange', {
                id: me.id,
                value
            })
        }
    }

    /**
     * Triggered before the markerStore config gets changed.
     * @param {Object} value
     * @param {Object} oldValue
     * @protected
     */
    beforeSetMarkerStore(value, oldValue) {
        oldValue?.destroy();

        return ClassSystemUtil.beforeSetInstance(value, Store, this.markerStoreConfig);
    }

    /**
     * @param {Boolean} updateParentVdom=false
     * @param {Boolean} silent=false
     */
    destroy(updateParentVdom=false, silent=false) {
        this.removeMap();
        super.destroy(updateParentVdom, silent);
    }

    /**
     * @param {String} id
     */
    hideMarker(id) {
        Neo.main.addon.GoogleMaps.hideMarker({
            appName: this.appName,
            id,
            mapId  : this.id
        })
    }

    /**
     * Hook to use once the map instance got rendered
     */
    onComponentMounted() {}

    /**
     * @param {Object} data
     */
    onMapZoomChange(data) {
        this.zoom = data.value;
    }

    /**
     * @param {Object} record
     */
    onMarkerClick(record) {
        console.log('onMarkerClick', record);
    }

    /**
     *
     */
    onMarkerStoreLoad() {
        let me = this;

        me.markerStore.items.forEach(item => {
            Neo.main.addon.GoogleMaps.addMarker({
                appName: me.appName,
                mapId  : me.id,
                ...item
            })
        })
    }

    /**
     * @param {Object} position
     * @param {Number} position.lat
     * @param {Number} position.lng
     */
    panTo(position) {
        Neo.main.addon.GoogleMaps.panTo({
            appName: this.appName,
            mapId  : this.id,
            position
        })
    }

    /**
     * Internal function. Use onMarkerClick() or the markerClick event instead
     * @param {Object} data
     * @protected
     */
    parseMarkerClick(data) {
        let me     = this,
            record = me.markerStore.get(data.id);

        me.onMarkerClick(record);

        me.fire('markerClick', {
            id: me.id,
            record
        })
    }

    /**
     *
     */
    removeMap() {
        Neo.main.addon.GoogleMaps.removeMap({
            appName: this.appName,
            mapId  : this.id
        })
    }

    /**
     * @param {String} id
     */
    removeMarker(id) {
        Neo.main.addon.GoogleMaps.removeMarker({
            appName: this.appName,
            id,
            mapId  : this.id
        })
    }

    /**
     * @param {String} id
     */
    showMarker(id) {
        Neo.main.addon.GoogleMaps.showMarker({
            appName: this.appName,
            id,
            mapId  : this.id
        })
    }
}

Neo.applyClassConfig(GoogleMaps);

export default GoogleMaps;
