//cache设置还有一些问题

var timeStamp=[0,new Date().getTime(),new Date().getTime()];
var prevOrder=-1;
var pageSize=20;
var rNews="https://api.readhub.me/news?lastCursor="+timeStamp[1]+"&pageSize="+pageSize;//科技动态
var rTopic="https://api.readhub.me/topic?lastCursor="+prevOrder+"&pageSize="+pageSize;//热门话题
var rTechNews="https://api.readhub.me/technews?lastCursor="+timeStamp[2]+"&pageSize="+pageSize;//开发者资讯
var data=[[],[],[]];
var doRefresh=true;
$cache.clear()
$ui.render({
    views: [
      {
        type: "menu",//tab or menu
        props: {
            id:"menu",
          items: ["热门话题","科技动态","开发者资讯"]
        },
        layout: function(make) {
          make.left.top.right.equalTo(0)
          make.height.equalTo(44)
        },
        events: {
          changed: function(sender) {
            var items = sender.items
            var index = sender.index
            if($cache.get("cache"+index)){
              doRefresh=false;
            }else{
              doRefresh=true;
            }
            $console.warn(index + ": " + items[index])
            switch(index){
              case 0:
               fetch(rTopic,index); 
               break;
              case 1:
               fetch(rNews,index);
               break;
              case 2:
               fetch(rTechNews,index);
               break;
              default:
               break;
            }
          }
        }
      },{
            type: "list",
            props: {
                template:[{
                  type:"label",
                  props:{
                    id:"title",
                    text:""
                  },
                  layout:function(make,view){
                    make.left.right.inset(10)
                    make.top.bottom.inset(10)
                  }
                }],
                data: [], 
            },
            layout: function(make,view){
                make.top.equalTo($("menu").bottom)
                make.left.bottom.right.inset(0)
            },
            events: {
              didSelect:function(sender,indexPath){
                if($("menu").index==0){
                  //热门话题
                  var newsArray=$("list").data[indexPath.row].url
                }else{
                  var newsArray=[{
                    siteName:$("list").data[indexPath.row].siteName,
                    title:$("list").data[indexPath.row].title.text
                  }]
                }
                openPage($("list").data[indexPath.row].summary,newsArray,$("list").data[indexPath.row].title.text)
              },
              didReachBottom:function(sender){
                $console.warn("Loading new feeds")
                var res=$("menu").index==0?rTopic:$("menu").index==1?rNews:rTechNews;
                $console.info("feed-"+res)
                doRefresh=true;
                sender.endFetchingMore()
                fetch(res,$("menu").index)
              },
              pulled:function(sender){
                $console.warn("Fetching latest feeds-"+$("menu").index)
                data[$("menu").index]=[]
                switch($("menu").index){
                  case 0:
                   prevOrder=-1;
                   break;
                  case 1:
                  timeStamp[1]=new Date().getTime();
                  break;
                  case 2:
                  timeStamp[2]=new Date().getTime();
                  break;
                }
                rNews="https://api.readhub.me/news?lastCursor="+timeStamp[1]+"&pageSize="+pageSize;//科技动态
                rTopic="https://api.readhub.me/topic?lastCursor="+prevOrder+"&pageSize="+pageSize;//热门话题
                rTechNews="https://api.readhub.me/technews?lastCursor="+timeStamp[2]+"&pageSize="+pageSize;//开发者资讯
                var res=$("menu").index==0?rTopic:$("menu").index==1?rNews:rTechNews;
                doRefresh=true;
                fetch(res,$("menu").index)
                
              }
            },
            
      }
    ]
  })


function fetch(uri=rTopic,item=0){
  if(doRefresh){
    $console.info("fetching"+uri)
    $http.get({
        url:uri,
        handler:function(resp){
            $console.info(resp.data)
            
            render(resp.data,item);
            $cache.set("cache"+item,resp.data)
        }
    })
  }else{
    render($cache.get("cache"+item),item)
  }
}

function render(dt,item=0){
    $console.warn("rendering "+dt.data[0].title)
    if(data[item]==null){data[item]=[];}
    for(var idx in dt.data){
        var news=dt.data[idx]
        $console.info(news.title)
        data[item].push({
          title:{
            text:news.title,
          },
          summary:item==0?news.summary:news.summaryAuto,
          order:news.order,
          publishDate:news.publishDate,
          url:item==0?news.newsArray:news.url,
          instantView:item==0?news.extra.instantView:true,
          siteName:news.siteName,
        })
        if(item==0){
          prevOrder=news.order;
        }
        timeStamp[item]=new Date(news.publishDate).getTime();
    }
    $console.info(data[item])
    $("list").data=data[item];

    //update res url
    rNews="https://api.readhub.me/news?lastCursor="+timeStamp[1]+"&pageSize="+pageSize;//科技动态
    rTopic="https://api.readhub.me/topic?lastCursor="+prevOrder+"&pageSize="+pageSize;//热门话题
    rTechNews="https://api.readhub.me/technews?lastCursor="+timeStamp[2]+"&pageSize="+pageSize;//开发者资讯

    $("list").endRefreshing();
}

function openURL(url) {
  if ($app.env == $env.today) {
    $app.openURL(url)
    return
  }
  $ui.push({
    props: {
      title: url
    },
    views: [{
      type: "web",
      props: {
        url: url
      },
      layout: $layout.fill
    }]
  })
}

function openPage(smry,dt,tt){
  var tmpdata=[];
  $console.error("openPage1")
  for(var idx in dt){
    tmpdata.push({
      subSource:{
        text:dt[idx].siteName
      },
      subTitle:{
        text:dt[idx].title
      }
    })
    $console.error("openPage1."+dt[idx].title)
  }
  $console.error("openPage2")
  $ui.push({
    props: {
      title:tt
    },
    views: [{
      type: "label",
      props: {
        id: "summary",
        lines:0,
        text:smry,
        font:$font(14)
      },
      layout: function(make, view) {
        make.left.top.right.inset(10)
      },
      events: {
        
      }
    },{
      type:"list",
      props:{
        id:"summaryList",
        data:tmpdata,
        template:[{
          type: "label",
          props: {
            id: "subSource",
            font:$font(10),
            bgcolor:$color("#00245E"),
            radius:2,
            color:$color("#FFFFFF")
          },
          layout: function(make, view) {
            make.left.inset(5)
            make.centerY.equalTo(view.super)
          },
          events: {
            
          }
        },{
          type: "label",
          props: {
            id: "subTitle",
            font:$font(14),
            
          },
          layout: function(make, view) {
            make.left.equalTo($("subSource").right).offset(3)
            make.centerY.equalTo(view.super)
          },
          events: {
            
          }
        }]
      },
      layout:function(make,view){
        make.left.right.inset(0)
        make.top.equalTo($("summary").bottom).offset(10)
        make.bottom.inset(0)
      },
      events:{
        didSelect:function(sender,indexPath){
          openURL(dt[indexPath.row].url);
        }
      }
    }]
  })
}

fetch(rTopic);
//$app.debug=true;