require([
  "esri/map",
  "dojo/_base/connect",
  "esri/dijit/Search",
  "esri/symbols/PictureMarkerSymbol",
  "esri/SpatialReference",
  "esri/graphic",
  "esri/geometry/Point",
  "esri/dijit/InfoWindow",
  "esri/dijit/InfoWindowLite",
  "dojo/dom-construct",
  "dojo/domReady!"
], function(Map, connect, Search, PictureMarkerSymbol, SpatialReference, Graphic, Point, InfoWindow, InfoWindowLite, domConstruct) {

  var map = new Map("map", {
    center: [-118, 34.5],
    zoom: 5,
    basemap: "national-geographic"
  });

  var infoWindow = new InfoWindowLite(null, domConstruct.create("div", null, null, map.root));
  infoWindow.startup();
  infoWindow.resize(212, 50);
  map.setInfoWindow(infoWindow);

  var textPrompts = [];
  var textPoints = [];
  var markerSymbol = new PictureMarkerSymbol("/images/mapicon.png", 30, 30);

  function addPt(lat, lng, text) {
    var pt = new Point(lng, lat, new SpatialReference({ wkid: 4326 }));
    var graphic = new Graphic(pt, markerSymbol);
    if (text) {
      graphic.id = 'text-' + textPrompts.length;
      textPrompts.push(text);
      textPoints.push(pt);
    }

    map.graphics.add(graphic);
    return pt;
  }

  function mapAddress(address, text, callback) {
    $.get('//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=' + address + '&f=json&outSR=4326&outFields=Addr_type%2CMatch_addr%2CStAddr%2CCity&maxLocations=1', function (data) {
      if (typeof data !== 'object') {
        data = JSON.parse(data);
      }

      if (data.candidates.length) {
        var geo = data.candidates[0].location;
        var pt = addPt(geo.y, geo.x, text);
        if (callback) {
          callback(pt);
        }
      }
    });
  }

  map.on("load", function(){
    if ($(".address").length == 1) {
      var place = $('body');
      if (place.find('.lat').val() * 1 && place.find('.lng').val() * 1) {
        var pt = addPt(place.find(".lat").val() * 1, place.find(".lng").val() * 1);
        map.centerAndZoom(pt, 14);
      } else {
        var address = $(".address").text() || $(".address").val() || "2 Marina Blvd, San Francisco, CA";
        mapAddress(address, null, function(pt) {
          map.centerAndZoom(pt, 14);
        });
      }
    } else if ($(".address").length > 1) {
      var places = $(".place");
      var knownAddress = {};
      for (var p = 0; p < places.length; p++) {
        var place = $(places[p]);
        var placeLink = '<a href="' + place.find('.place-title').attr("href") + '">' + place.find('.place-title').text() + '</a>'
        if (place.find('.lat').val() * 1 && place.find('.lng').val() * 1) {
          //console.log('adding lat/lng');
          addPt(place.find(".lat").val() * 1, place.find(".lng").val() * 1, placeLink);
        } else {
          var address = place.find(".address").text() || place.find(".address").val();
          //console.log('adding ' + address);
          if (knownAddress[address]) {
            continue;
          }
          knownAddress[address] = true;
          mapAddress(address, placeLink);
        }
      }
      var pt = new Point(-122.413, 37.78, new SpatialReference({ wkid: 4326 }));
      map.centerAndZoom(pt, 12);
    }

    map.graphics.on("click", function (evt) {
      var id = evt.graphic.id.split('-');
      if (id.length > 1) {
        infoWindow.setTitle(textPrompts[id[1] * 1]);
        infoWindow.show(pt, pt, InfoWindow.ANCHOR_UPPERRIGHT);
      }
    });
  });
});
