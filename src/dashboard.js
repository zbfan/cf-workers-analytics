/**
 * Dashboard HTML - Single Page Application
 * Self-contained analytics dashboard with responsive design
 */
export function renderDashboard(env) {
  const siteUrl = (env && env.SITE_URL) || 'https://analytics.yourdomain.com';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HanAnalytics - 网站分析仪表板</title>
<style>
:root{--primary:#4f46e5;--primary-light:#6366f1;--bg-dark:#0f172a;--bg-card:#1e293b;--bg-card-hover:#334155;--text-primary:#f1f5f9;--text-secondary:#94a3b8;--border:#334155}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;background:var(--bg-dark);color:var(--text-primary);min-height:100vh;line-height:1.6}
.container{max-width:1400px;margin:0 auto;padding:16px}
.header{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-bottom:1px solid var(--border);padding:16px 0;position:sticky;top:0;z-index:100}
.header-inner{max-width:1400px;margin:0 auto;padding:0 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.header-logo{display:flex;align-items:center;gap:8px;font-size:20px;font-weight:700}
.header-logo .icon{color:var(--primary-light);font-size:24px}
.header-controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;transition:transform .2s,box-shadow .2s}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,.3)}
.stat-card .label{font-size:13px;color:var(--text-secondary);margin-bottom:8px}
.stat-card .value{font-size:28px;font-weight:700}
.stat-card .change{font-size:12px;margin-top:4px}
.charts-section{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:24px}
@media(min-width:768px){.charts-section.grid-2{grid-template-columns:1fr 1fr}.charts-section.grid-3{grid-template-columns:1fr 1fr 1fr}}
.chart-card{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px}
.chart-card h3{font-size:15px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
.chart-card h3 .badge{font-size:11px;background:var(--primary);padding:2px 8px;border-radius:10px;font-weight:400}
.bar-chart{display:flex;flex-direction:column;gap:8px}
.bar-item{display:flex;align-items:center;gap:10px}
.bar-label{min-width:80px;font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar-track{flex:1;height:24px;background:rgba(255,255,255,.05);border-radius:12px;overflow:hidden}
.bar-fill{height:100%;border-radius:12px;transition:width .6s ease}
.bar-fill.c1{background:linear-gradient(90deg,#6366f1,#818cf8)}
.bar-fill.c2{background:linear-gradient(90deg,#22c55e,#4ade80)}
.bar-fill.c3{background:linear-gradient(90deg,#f59e0b,#fbbf24)}
.bar-fill.c4{background:linear-gradient(90deg,#ef4444,#f87171)}
.bar-fill.c5{background:linear-gradient(90deg,#8b5cf6,#a78bfa)}
.bar-fill.c6{background:linear-gradient(90deg,#06b6d4,#22d3ee)}
.bar-value{min-width:30px;font-size:13px;font-weight:600;text-align:right}
.time-chart{width:100%;height:200px;position:relative}
.time-chart canvas{width:100%;height:100%}
.data-table{width:100%;border-collapse:collapse;font-size:13px}
.data-table th{text-align:left;padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text-secondary);font-weight:500;font-size:12px;text-transform:uppercase}
.data-table td{padding:10px 12px;border-bottom:1px solid rgba(51,65,85,.5)}
.data-table tr:hover td{background:rgba(255,255,255,.03)}
select,button{background:var(--bg-card);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;transition:all .2s}
select:hover,button:hover{background:var(--bg-card-hover);border-color:var(--primary)}
.sites-panel{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px}
.sites-panel h3{margin-bottom:12px;font-size:14px}
.site-list{display:flex;flex-wrap:wrap;gap:8px}
.site-tag{padding:6px 14px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);border-radius:20px;font-size:12px;cursor:pointer;transition:all .2s}
.site-tag:hover,.site-tag.active{background:var(--primary);border-color:var(--primary)}
.loading{display:flex;justify-content:center;align-items:center;padding:40px;color:var(--text-secondary)}
.spinner{width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:640px){.container{padding:12px}.stats-grid{grid-template-columns:1fr 1fr;gap:10px}.stat-card{padding:14px}.stat-card .value{font-size:22px}.header-logo{font-size:16px}.header-controls{width:100%}.header-controls select,.header-controls button{flex:1}}
.empty-state{text-align:center;padding:40px 20px;color:var(--text-secondary)}
.empty-state .emoji{font-size:40px;margin-bottom:16px}
.footer{text-align:center;padding:20px;color:var(--text-secondary);font-size:12px;border-top:1px solid var(--border);margin-top:24px}
.tooltip{position:fixed;background:#1e293b;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px;pointer-events:none;z-index:1000;display:none}
</style>
</head>
<body>
<div class="header">
  <div class="header-inner">
    <div class="header-logo"><span class="icon">&#9670;</span>HanAnalytics<span style="font-size:11px;color:var(--text-secondary);font-weight:400;margin-left:4px;" id="versionTag"></span></div>
    <div class="header-controls">
      <select id="siteSelect" onchange="switchSite()"><option value="default">默认站点</option></select>
      <select id="periodSelect" onchange="loadData()">
        <option value="1h">最近1小时</option><option value="24h">最近24小时</option><option value="7d" selected>最近7天</option>
        <option value="30d">最近30天</option><option value="90d">最近90天</option><option value="all">全部</option>
      </select>
      <button onclick="refreshData()">&#x21bb;</button><button onclick="exportData()">&#x2197;导出</button>
    </div>
  </div>
</div>
<div class="container">
  <div class="sites-panel">
    <h3>&#x1f517; 监控站点</h3>
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">在网站底部添加以下代码即可开始追踪：</p>
    <pre id="embedCode" style="background:rgba(0,0,0,.3);padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;margin-bottom:12px;color:#94a3b8;"><script defer src="${siteUrl}/script.js" data-website-id="your-site-id"></script></pre>
    <div class="site-list" id="siteList"><span class="site-tag active" onclick="switchSite('default')">默认站点</span></div>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="label">&#x1f4ca;总浏览量</div><div class="value" id="statTotal">-</div><div class="change" id="statAvgDaily">日均:-</div></div>
    <div class="stat-card"><div class="label">&#x1f465;独立访客</div><div class="value" id="statUnique">-</div><div class="change" id="statUniqueRate">-/总访问</div></div>
    <div class="stat-card"><div class="label">&#x23f0;当前小时</div><div class="value" id="statHourly">-</div><div class="change">实时请求</div></div>
    <div class="stat-card"><div class="label">&#x1f4c5;日期范围</div><div class="value" id="statDays">-</div><div class="change">数据天数</div></div>
  </div>
  <div class="charts-section grid-2">
    <div class="chart-card"><h3>&#x1f4c8;访问趋势<span class="badge">按小时</span></h3><div class="time-chart" id="timeChartContainer"><div class="loading"><div class="spinner"></div></div></div></div>
    <div class="chart-card"><h3>&#x1f4f1;设备分布</h3><div id="deviceChart"><div class="loading"><div class="spinner"></div></div></div></div>
  </div>
  <div class="charts-section grid-3">
    <div class="chart-card"><h3>&#x1f310;国家分布</h3><div id="countryChart"><div class="loading"><div class="spinner"></div></div></div></div>
    <div class="chart-card"><h3>&#x1f5a5;浏览器</h3><div id="browserChart"><div class="loading"><div class="spinner"></div></div></div></div>
    <div class="chart-card"><h3>&#x1f4bb;操作系统</h3><div id="osChart"><div class="loading"><div class="spinner"></div></div></div></div>
  </div>
  <div class="charts-section grid-3">
    <div class="chart-card"><h3>&#x1f30d;网络运营商</h3><div id="networkChart"><div class="loading"><div class="spinner"></div></div></div></div>
    <div class="chart-card"><h3>&#x1f517;来源页面</h3><div id="referrerChart"><div class="loading"><div class="spinner"></div></div></div></div>
    <div class="chart-card"><h3>&#x1f4cd;设备品牌</h3><div id="brandChart"><div class="loading"><div class="spinner"></div></div></div></div>
  </div>
  <div class="chart-card" style="margin-bottom:24px;">
    <h3>&#x1f552;最近访问<span class="badge">最新100条</span></h3>
    <div style="overflow-x:auto;" id="recentTable"><div class="loading"><div class="spinner"></div></div></div>
  </div>
</div>
<div class="footer">HanAnalytics v<span id="footerVersion">1.0.0</span> &middot; Powered by Cloudflare Workers</div>
<div class="tooltip" id="tooltip"></div>
<script>
var site='default',period='7d';
document.addEventListener('DOMContentLoaded',function(){loadSites();loadVersion();loadData();setInterval(loadData,30000)});
async function loadVersion(){try{var r=await fetch('/api/version'),d=await r.json();document.getElementById('versionTag').textContent='v'+d.version;document.getElementById('footerVersion').textContent=d.version}catch(e){}}
async function loadSites(){try{var r=await fetch('/api/sites'),d=await r.json(),list=document.getElementById('siteList'),sel=document.getElementById('siteSelect');list.innerHTML='';sel.innerHTML='';(d.data||[]).forEach(function(s){var t=document.createElement('span');t.className='site-tag'+(s.website_id===site?' active':'');t.textContent=s.website_id;t.onclick=function(){switchSite(s.website_id)};list.appendChild(t);var o=document.createElement('option');o.value=s.website_id;o.textContent=s.website_id;if(s.website_id===site)o.selected=true;sel.appendChild(o)})}catch(e){}}
function switchSite(s){site=s;document.getElementById('siteSelect').value=s;loadData();loadSites()}
async function loadData(){period=document.getElementById('periodSelect').value;try{var r=await fetch('/api/overview?website_id='+site+'&period='+period),d=await r.json();updateOverview(d);loadTimeSeries();loadDist('browsers','browserChart');loadDist('os','osChart');loadDist('devices','deviceChart');loadDist('countries','countryChart');loadDist('networks','networkChart');loadDist('apps','referrerChart');loadBrand();loadRecent()}catch(e){}}
async function loadTimeSeries(){try{var r=await fetch('/api/timeseries?website_id='+site+'&period='+period+'&groupBy=hour'),d=await r.json();renderTimeChart(d.data||[])}catch(e){}}
async function loadDist(ep,el){try{var r=await fetch('/api/'+ep+'?website_id='+site+'&period='+period),d=await r.json();renderBar(el,d.data||[])}catch(e){}}
async function loadBrand(){try{var r=await fetch('/api/devices?website_id='+site+'&period='+period),d=await r.json();renderBar('brandChart',(d.data||[]).filter(function(x){return x.device&&x.device!='unknown'}))}catch(e){}}
async function loadRecent(){try{var r=await fetch('/api/recent?website_id='+site),d=await r.json();renderRecent(d.data||[])}catch(e){}}
function updateOverview(d){document.getElementById('statTotal').textContent=f(d.total||0);document.getElementById('statUnique').textContent=f(d.unique||0);document.getElementById('statHourly').textContent=f(d.currentHour||0);document.getElementById('statAvgDaily').textContent='日均:'+f(d.avgDaily||0);document.getElementById('statUniqueRate').textContent=(d.unique&&d.total?(d.unique/d.total*100).toFixed(1):'0')+'%独立率';document.getElementById('statDays').textContent=(d.timeStats?d.timeStats.length:0)+'天'}
function renderTimeChart(d){var c=document.getElementById('timeChartContainer');if(!d||!d.length){c.innerHTML='<div class="empty-state"><div class="emoji">&#x1f4ca;</div><p>暂无数据</p></div>';return}
var cv=document.createElement('canvas');c.innerHTML='';c.appendChild(cv);var ctx=cv.getContext('2d'),w=c.clientWidth||600,h=200;cv.width=w*2;cv.height=h*2;cv.style.width=w+'px';cv.style.height=h+'px';ctx.scale(2,2)
var vals=d.map(function(x){return parseInt(x.count)}),labels=d.map(function(x){var t=x.time||'';return t.length>16?t.substring(5,16):t.substring(5)}),max=Math.max.apply(null,vals.concat([1])),pad={top:20,right:20,bottom:30,left:40},cw=w-pad.left-pad.right,ch=h-pad.top-pad.bottom;ctx.clearRect(0,0,w,h)
ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;for(var i=0;i<=4;i++){var y=pad.top+(ch/4)*i;ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';ctx.textAlign='right';ctx.fillText(f(Math.round((max/4)*(4-i))),pad.left-5,y+4)}
if(vals.length<2){var bw=Math.min(cw*0.6,40),bx=pad.left+(cw-bw)/2,bh=(vals[0]/max)*ch,by=pad.top+ch-bh,g=ctx.createLinearGradient(bx,by,bx,pad.top+ch);g.addColorStop(0,'#6366f1');g.addColorStop(1,'rgba(99,102,241,.3)');ctx.fillStyle=g;ctx.fillRect(bx,by,bw,bh);ctx.fillStyle='#f1f5f9';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(f(vals[0]),bx+bw/2,by-8);ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';ctx.fillText(labels[0],bx+bw/2,h-5);return}
var stepX=cw/(vals.length-1);ctx.beginPath();ctx.moveTo(pad.left,pad.top+ch);vals.forEach(function(v,i){var x=pad.left+i*stepX,y=pad.top+ch-(v/max)*ch;ctx.lineTo(x,y)});ctx.lineTo(pad.left+(vals.length-1)*stepX,pad.top+ch);ctx.closePath();var g=ctx.createLinearGradient(0,pad.top,0,pad.top+ch);g.addColorStop(0,'rgba(99,102,241,.3)');g.addColorStop(1,'rgba(99,102,241,.01)');ctx.fillStyle=g;ctx.fill()
ctx.beginPath();vals.forEach(function(v,i){var x=pad.left+i*stepX,y=pad.top+ch-(v/max)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.strokeStyle='#6366f1';ctx.lineWidth=2;ctx.stroke()
var stepL=Math.max(1,Math.floor(vals.length/10));vals.forEach(function(v,i){var x=pad.left+i*stepX,y=pad.top+ch-(v/max)*ch;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#6366f1';ctx.fill();if(i%stepL===0||i===vals.length-1){ctx.fillStyle='#94a3b8';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(labels[i],x,h-5)}})
cv.onmousemove=function(e){var rect=cv.getBoundingClientRect(),mx=e.clientX-rect.left,idx=Math.round((mx-pad.left)/stepX);if(idx>=0&&idx<vals.length){var t=document.getElementById('tooltip');t.style.display='block';t.style.left=(e.clientX+12)+'px';t.style.top=(e.clientY-10)+'px';t.innerHTML=labels[idx]+'<br><strong>'+f(vals[idx])+'</strong>次访问'}};cv.onmouseleave=function(){document.getElementById('tooltip').style.display='none'}}
function renderBar(elId,d){var c=document.getElementById(elId);if(!d||!d.length){c.innerHTML='<div class="empty-state"><p style="color:var(--text-secondary);font-size:13px;">暂无数据</p></div>';return}
var max=Math.max.apply(null,d.map(function(x){return parseInt(x.count)})),colors=['c1','c2','c3','c4','c5','c6'],html='<div class="bar-chart">';d.slice(0,10).forEach(function(item,i){var pct=max>0?parseInt(item.count)/max*100:0,k=Object.keys(item).find(function(k){return k!=='count'&&k!=='name'}),dn=item.display||item[k]||k||item.name||'未知';html+='<div class="bar-item"><span class="bar-label" title="'+dn+'">'+tr(dn,15)+'</span><div class="bar-track"><div class="bar-fill '+colors[i%colors.length]+'" style="width:'+pct+'%"></div></div><span class="bar-value">'+f(item.count)+'</span></div>'});html+='</div>';c.innerHTML=html}
function renderRecent(d){var c=document.getElementById('recentTable');if(!d||!d.length){c.innerHTML='<div class="empty-state"><div class="emoji">&#x1f4ad;</div><p>暂无访问记录</p></div>';return}
var html='<table class="data-table"><thead><tr><th>时间</th><th>IP</th><th>国家</th><th>浏览器</th><th>OS</th><th>设备</th><th>页面</th></tr></thead><tbody>';d.slice(0,50).forEach(function(v){var di=v.is_mobile==1?'&#x1f4f1;':'&#x1f4bb;',cd=v.country_display||v.country||'-';html+='<tr><td style="white-space:nowrap;font-size:12px;">'+(v.time||'-')+'</td><td style="font-family:monospace;font-size:12px;">'+(v.ip_hash?v.ip_hash.substring(0,8)+'...':'-')+'</td><td>'+cd+'</td><td>'+(v.browser||'-')+' '+(v.browser_version||'').substring(0,5)+'</td><td>'+(v.os||'-')+'</td><td>'+di+' '+(v.device||'-')+(v.device_brand?' '+v.device_brand:'')+'</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+v.url+'">'+(v.url||'-')+'</td></tr>'});html+='</tbody></table>';c.innerHTML=html}
async function exportData(){try{var r=await fetch('/api/export?website_id='+site),b=await r.blob(),u=window.URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='analytics-'+site+'-'+Date.now()+'.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);window.URL.revokeObjectURL(u)}catch(e){alert('导出失败: '+e.message)}}
function f(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n.toString()}
function tr(s,l){if(!s)return'-';return s.length>l?s.substring(0,l)+'...':s}
</script>
</body>
</html>`;
}