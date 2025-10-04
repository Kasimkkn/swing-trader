
--> Issues with Analyse Functionality

1. Search + Yahoo API integration

   » Currently, when searching for a stock symbol that does not exist in the Suggestion List or Stocks table, the system fails to fetch details.
   » Required behavior:

     » Call the Yahoo API to fetch `symbol`, `company_name`, `current_price`, `industry`, and `timestamp`.
     » Store this new stock data in the stocks table.
     » And then Analse the Stock with Our fucntionaltiy

2. Multiple API calls (analyse-stock + research-stock)

   » At present, clicking the Analyse button triggers two separate API calls: `analyse-stock` and `research-stock`.
   » These must be merged into a single API call to ensure data consistency and reduced latency.

3. Recommendation Logic (Buy / Sell / Hold)

   » Enhance the Analyse function with a recommendation engine that mimics a swing trader with 20+ years of experience.
   » For the searched stock, the function should evaluate short-term movement (1–3 days) and recommend one of:

     » Buy → with entry price, exit target, and stop loss
     » Hold / Purchase Later → if conditions aren’t right yet
     » Sell → if the stock is likely to decline
   » The prediction engine must be deep, clear, and research-backed with a target accuracy of ~90% in price direction forecasting.

---

--> Issues with `/today` Page (Swing Trader Recommendations)

1. Empty State

   » The page currently shows:

     > “No Recommendations Yet. Click refresh to generate today’s swing-trader recommendations.”
   » This is not acceptable.
   » The `/today` page must always display today’s recommendations by default.
   » Users should be able to change the date to view past recommendations, but never see an empty state for today.

2. Cron Job & Stock Rotation Issue

   » The 2-hour cron job is not functioning as expected.
   » Current behavior: only processes stocks 1–50 from the list of 1500, which leads to repetitive recommendations and no new signals.
   » Required improvement:

     » On each 2-hour run, the system should rotate through the stock list so that different batches of stocks are analyzed each time.
     » This ensures fresh recommendations and full coverage of the entire 1500-stock universe.

---

✅ In summary:

» Fix Analyse functionality (Yahoo API fallback + merge API calls + consistent recommendation engine with buy/sell/hold + targets/stop loss).
» Fix `/today` page (always populated with today’s recommendations, date filter for history, no empty state).
» Fix cron job (ensure all 1500 stocks are processed in rotation, not just 1–50).



can u rephrase this perfectly
--> The analyse fucntionaltiy has bugs:
1. when i search for any Symbol of stock which is not in the Suggestion List and stock tables then we have to call the yahooo api and get the detail of the symbol , company_name , current_price and industry with Timestamp and store it in the stocks table 

2. when we click on Analyse button we get 2 api call one with analyse-stock and research-stock 

so we have to combine them in one Api call and make sure that we have a complete consistency in data 

and here u have to create A fucntion which tells u about the stock to buy or not  ,u are swing trader with 20+ yrs of exp and u have asked to recommend the Search Stock that will move upwards from today or tomorrow or day after tomorrow that means this stock that is going down today but can go up tomorrow or this stock that is going up Today but will also move up tomorrow too ,  so u have to recommend for Buy or if Purhcase or Sell now if purhcase and if Buy then entery price , exti price and stop loss too 

so u have to make sure the Analyse Functionality Has deeep Clear Clean Research With 90% of the stock Price predictions 

--> the /today page where we have Swing Trader Recommendations

why does it shows 

No Recommendations Yet
Click refresh to generate today's swing-trader recommendations

this State??? we don't want that 

this Page will always be filled with todays data and can change the date and get those day recommended a stock


aslo the problem in the fucntionaltiy of this stock has 

the 2hr cron job is not working as expected and aslo we have 1500 stock list and we always just process 1 to 50 stocks olny which is the prblm that we dont get any new recommendation so we need some fucntionaltiy where on every 2hr the stock list is change so that we get new recommendations if possible


