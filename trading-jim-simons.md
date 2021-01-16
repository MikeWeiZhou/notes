# Trading: Jim Simons
Grass mud horse.

## Renaissance Technologies (since 1982)
- **mostly statistics, some probabilities** in the system - J.S.
- started with mean-reversion and trend-following in commodities
- core strategy is `portfolio-level statistical arbitrage`
  - portolios of long and short positions created that hedge out market risk, sector risk, and other statistically predictable risks
  - call option ideal
    - provides leverage
    - protection against probability of loss greater than the option premium and black swans
- collects all publicly available data -- news stories, analysts' reports, energy reports, crop reports, weather reports, regulatory findings, accounting data, quotes and trades from markets around the world
  - ~ 9TB of data daily
- appears to have significant increase in returns during years around economic recessions
- game and information theory (Elwyn Berlekamp)
  - shoter term trades reduces risk (HF?)
  - handle trades like casino (with statistical advantage)
    - Kelly Criterion
- asset prices are [stochastic processes](https://en.wikipedia.org/wiki/Stochastic_process)
  - built models with machine learning
    - likely used [kernel methods](https://en.wikipedia.org/wiki/Kernel_method) for pattern analysis
      - to this day, linear regression for forecasting models dominates, but asset prices are non-linear
      - build non-linear models such as `high dimensional kernel regression` - best for trending models (how long a trend will last)
- any one anomaly might be random, but with enough data, you can tell if its not
- automated signal extraction from data
- information geometry?

## Resources
- Youtube: [Renaissance Technologies - Trading Strategies Revealed](https://www.youtube.com/watch?v=lji-jNsXmAM) - educated guesses and some history on RenTech
- Youtube: [How I Built The Best Trading Algorithm](https://www.youtube.com/watch?v=IZeo-Vj4dco) - overall view of the system, limited info
- Quora: [Investment Strategies of James Simons/RenTech](https://www.quora.com/What-are-the-investment-strategies-of-James-Simons-Renaissance-Technologies-I-understand-he-employs-complex-mathematical-models-along-with-statistical-analyses-to-predict-non-equilibrium-changes#:~:text=The%20core%20strategy%20is%20portfolio,that%20Renaissance%20can%20statistically%20predict.) - answered by someone who somewhat knows part of the RenTech team