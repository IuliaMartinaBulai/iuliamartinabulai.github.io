app.controller('researchCtrl', function($scope, $rootScope, $routeParams, $location, $http, $sce) {
  /*------------------------------
    helper functions
  ------------------------------*/
  function boxHeight(text) {
    if (! (text instanceof Array)) return undefined;
    let w = $(window).width();
    if (w <= 767) w *= 12 / 9;
    return "dim" + Math.floor((200 * text.join().length / w + 19 * text.length + 18)/100 + 1);
  };
  function getYear(x) {
    return "20" + x._date.substr(0,2);
  };
  function getMonth(x) {
    return ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"][parseInt(x._date.substr(3,2))];
  };
  function getDate(x) {
    return getMonth(x) + " " + getYear(x);
  };
  function getColor(x) {
    switch (x.type) {
      case "Event":
        return "#fff";
      case "Position":
        return "#e5c7b5";
      case "Prize":
        return "#f4f4cb";
      case "Project":
        return "#ff7fc9";
      default:
        return "#d1f3ff";
    }
  };
  function toText(l) {
    if (l == "" || l == undefined) return "";
    if (l.startsWith("http")) return "website";
    return l;
  };
  function toLink(l) {
    if (l == "" || l == undefined) return "";
    if (l.startsWith("http")) return l;
    if (l.startsWith("ISBN:")) return "";
    if (l.startsWith("arXiv:")) return l.replace("arXiv:", "https://arxiv.org/abs/");
    return "https://doi.org/" + l;
  };
  /*------------------------------
    formatting functions
  ------------------------------*/
  function formatPublication(p) {
    return {
      teaser:       $scope.data.teaser ? "new publication!" : "",
      pretitle:     p.authors + ". ",
      title:        p.title + ".",
      subtitle:     p.journal + ", " + p.year + ".",
      subsubtitle:  toText(p.link),
      link:         toLink(p.link),
      text:         p.abstract,
      topic:        p.topic,
      type:         p.type,
      _top:         $scope.data.select ? (p._top ? p._top : 1000) : 0,
      _dim:         boxHeight(p.abstract),
      _show:        false,
      _template:    "box",
      _color:       "#eee",
      _date:        p._date
    };
  };
  function formatOther(p) {
    return {
      teaser:       $scope.data.teaser ? (p.teaser ? p.teaser : "new "+p.type.toLowerCase()+"!") : "",
      title:        p.title + ".",
      subtitle:     p.subtitle + ".",
      subsubtitle:  toText(p.link),
      link:         toLink(p.link),
      text:         ("text" in p) ? p.text : [],
      _dim:         boxHeight(p.text),
      _show:        false,
      _template:    "box",
      _color:       getColor(p),
      _date:        p._date
    };
  };
  function formatAll(p) {
    return $rootScope.research.get("_db_").types.includes(p.type) ? formatPublication(p) : formatOther(p);
  };
  function addByKeyword(content, data, numbers, formatter, getKeyword) {
    let idx = new Map();
    for (let i=0; i<content.length; ++i) {
      idx.set(content[i].title ? content[i].title : content[i].subtitle, i);
      content[i]._template = "section";
      content[i].items = [];
      content[i]._num = i;
    }
    function getIdx(d) {
      for (const key of getKeyword(d)) if (idx.has(key)) return idx.get(key);
      return undefined;
    };
    for (const d of data) {
      const i = getIdx(d);
      if (i != undefined) content[i].items.push(formatter(d));
    }
    for (let c of content) {
      function compare(a,b) {
        if (a._top != b._top) return a._top < b._top ? -1 : 1;
        return a._date < b._date ? 1 : -1;
      };
      c.items.sort(compare);
      let maxlen = undefined;
      const pfx = "[" + c.title.replace(/[^A-Z]/g, "");
      for (let i=0; i<c.items.length; ++i) {
        c.items[i]._num = i;
        if (numbers) c.items[i].num = pfx + ($scope.data.select ? i+1 : c.items.length-i) + "] ";
        if (maxlen == undefined && c.items[i]._top == 1000) maxlen = i;
      }
      c.maxlen = maxlen;
    }
  };
  function partitionDates(data, filter) {
    let yc = new Map();
    for (const d of data) if (filter(d)) {
      let y = getYear(d);
      yc.set(y, yc.has(y) ? yc.get(y)+1 : 1);
    }
    let dates = new Map();
    for (const d of data) if (filter(d)) {
      if (yc.get(getYear(d)) <= 4) dates.set(getYear(d), d._date);
      else dates.set(getDate(d), d._date);
    }
    let content = [];
    for (const d of dates) content.push({title: "", subtitle: d[0], _date: d[1]});
    content.sort((a,b) => (a._date < b._date ? 1 : -1));
    return content;
  }
  /*------------------------------
    default values
  ------------------------------*/
  let def = {
    nphoto: 3,          // number of photos
    theme:  "research", // resources theme and overall title
    color:  "#3468d8",  // theme color
    teaser: false,      // if box teasers are present
    select: false,      // if some boxes are to be promoted
    maxlen: 1000        // how many sections initially
  };
  let pages = [{
    /*------------------------------
      home page
    ------------------------------*/
    title:    "Home",
    teaser:   true,
    painter:  function(db) {
               let highlighs = partitionDates(db.news, function(x) {
                  return ["Prize", "Project", "Grant", "Event", "Position"].includes(x.type);
                });
                addByKeyword(highlighs, db.news, false, formatOther, function(x) {
                  return ["Prize", "Project", "Grant", "Event", "Position"].includes(x.type) ? [getDate(x), getYear(x)] : [];
                }); 
                let data = db.publications.concat(db.news); 
                let updates = partitionDates(data, function(x) {
                  return !(["Lecture Notes", "Submitted Preprints", "Prize", "Project", "Grant", "Event", "Position"].includes(x.type));
                });
                addByKeyword(updates, data, false, formatAll, function(x) {
                  return ["Lecture Notes", "Submitted Preprints", "Prize", "Project", "Grant", "Event", "Position"].includes(x.type) ? [] : [getDate(x), getYear(x)];
                });
                return [
                                    {
                    title:      "Short Bio",
                    items: [{
                      title:      "",
                      main:       db.bio,
                      _template:  "box",
                      _color:     "#fff",
                      _show:      false
                    }],
                    _template:  "section"
                  },
                  {
                    title:      "News Highlights",
                    items:      highlighs,
                    _template:  "section"
                  }, {
                    title:      "Live Updates",
                    items:      updates,
                    maxlen:     5,
                    _template:  "section"
                  } 
                ];
              }
  }, {
    /*------------------------------
      topics page
    ------------------------------*/
    title:    "Topics",
    select:   true,
    painter:  function(db) {
                let content = [];
                for (const d of db.topics) content.push({title: d.title, text: d.abstract});
                addByKeyword(content, db.publications, true, formatPublication, function(i) {
                  return [i.topic];
                });
                return content;
              }
  }, {
    /*------------------------------
      publications page
    ------------------------------*/
    title:    "Publications",
    painter:  function(db) {
                let content = [];
                for (const d of db.types) content.push({title: d});
                addByKeyword(content, db.publications, true, formatPublication, function(i) {
                  return [i.type];
                });
                return content;
              }
  }, {
    /*------------------------------
      events page
    ------------------------------*/
    title:    "Events",
    maxlen:   5,
    painter:  function(db) {
                let content = partitionDates(db.news, function(x) {
                  return x.type == "Event";
                });
                addByKeyword(content, db.news, false, formatOther, function(x) {
                  return x.type != "Event" ? [] : [getDate(x), getYear(x)];
                });
                return content;
              }
  }, {
    /*------------------------------
      teaching page
    ------------------------------*/
    title:    "Teaching",
    painter:  function(db) {
                for (let d of db.teaching) {
                  d._template = "box";
                  d._color = "#c9f2c9";
                  d._dim = boxHeight(d.text);
                  d._show = true;
                }
                return db.teaching;
              }
  },{
    /*------------------------------
      media page
    ------------------------------*/
    title:    "Media",
    painter:  function(db) {
                for (let d of db.media) {
                  d._template = "box";
                  d._color = "#c9f2c9";
                  d._dim = boxHeight(d.text);
                  d._show = true;
                }
                return db.media;
              }
  }];
  $rootScope.pageSet($scope, $location, $http, $sce, $routeParams.page, def, pages);
});
