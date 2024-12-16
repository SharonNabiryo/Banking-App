
class CoinCollector:

    def __init__(self):
        # Initialize a dictionary to hold the value of different coins in cents
        self.coin_values = {
            'P' : 1,   # penny
            'N' : 5,   # Nickle
            'D' : 10,  # Dime
            'Q' : 25,  # Quarter
            'H' : 50,  # half Dollar
            'W' : 100 # Whole Dollar
        }
    
    def parseChange(self, coins):
       """
       Parses the input list of coin characters and calculates the total value in cents.

       Parameters:
       coins (list): A list of coin characters (P, N, D, Q, H, W).

       Returns:
       int: Total value of valid coins in cents."""

       total_cents = 0 # Initialize total value of valid coins
       invalid_coins = [] # List to keep track of invalid coin characters
       
       for coin in coins:
           if coin in self.coin_values:
               total_cents += self.coin_values[coin]  # Add valid coin value to total
           else:
               invalid_coins.append(coin) # Store invalid coin for reporting

       # If there are invalid coins, print a message
       if invalid_coins:
           print(f"Invalid coin character: {', '.join(invalid_coins)}")

       return total_cents  # If there are invalid coins, print a message



collector = CoinCollector()

