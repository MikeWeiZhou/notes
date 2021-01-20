# Algo: Sliding Window

Many problems dealing with an array or LinkedList asks to calculate something among all `contiguous subarrays` of a given or dynamic size. This pattern generally gives a better time complexity than brute force methods.

## Pattern
1. Expand window (subarray) to right
2. Shrink window from left
3. Recalculate min/max/...

## Simplified Example
```
function find_averages_of_subarrays(K, arr) {
  const result = [];
  let windowSum = 0.0,
    windowStart = 0;
  for (let windowEnd = 0; windowEnd < arr.length; windowEnd++) {
    windowSum += arr[windowEnd]; // add the next element
    // slide the window, we don't need to slide if we've not hit the required window size of 'k'
    if (windowEnd >= K - 1) {
      result.push(windowSum / K); // calculate the average
      windowSum -= arr[windowStart]; // subtract the element going out
      windowStart += 1; // slide the window ahead
    }
  }

  return result;
}
```

## Deviations
- sometimes need to use data structures to count frequency of characters or store index positions