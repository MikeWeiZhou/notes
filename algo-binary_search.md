# Algo: Binary Search
> legend: `l` = left, `r` = right, `^` = mid
```
TC worst      O(log n)
TC average    O(log n)
SC worst      O(1)
```

## Contents
- [Odd vs Even Length](#odd-vs-even-length)
- [Ceiling vs Floor](#ceiling-vs-floor)
- [Calculating Middle Index](#calculating-middle-index)

## Odd vs Even Length
```
[--   5    --][--     6    --]
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]    length = 10
 l           ^              r     m=0+(9-0)/2=4   (floor)
             l     ^        r     m=4+(9-4)/2=6   (floor)
                   l  ^     r     m=6+(9-6)/2=7   (floor)
                   l  r           m=6+(7-6)/2=6=l (floor)
```
```
[--   5    --][--   5   --]
[0, 1, 2, 3, 4, 5, 6, 7, 8]     length = 9
 l           ^           r      m=0+(8-0)/2=4
             l     ^     r      m=4+(8-4)/2=6
                   l  ^  r      m=6+(8-6)/2=7
```

## Ceiling vs Floor
```
[--     6     --][--   5   --]
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]    length = 10
 l              ^           r     m=0+(9-0)/2=5   (ceil)
 l        ^     r                 m=0+(5-0)/2=3   (ceil)
 l     ^  r                       m=0+(3-0)/2=2   (ceil)
 l  ^  r                          m=0+(2-0)/2=1
    l  r                          m=1+(2-1)/2=2=r (ceil)
```
```
[--   5    --][--     6    --]
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]    length = 10
 l           ^              r     m=0+(9-0)/2=4   (floor)
             l     ^        r     m=4+(9-4)/2=6   (floor)
                   l  ^     r     m=6+(9-6)/2=7   (floor)
                   l  r           m=6+(7-6)/2=6=l (floor)
```

## Calculating Middle Index
```
m = l + ((r - l) / 2)
m = l + r/2 - l/2
m = l/2 + r/2
m = (l + r)/2
```