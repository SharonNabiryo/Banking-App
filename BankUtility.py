from random import randint

class BankUtility:
    def __init__(self):
        # No initialization needed for this utility class
        pass

    @staticmethod
    def promptUserForString(prompt: str) -> str:
        """
                Prompts the user for a string input.

                Parameters:
                prompt (str): The prompt message displayed to the user.

                Returns:
                str: The user's input as a string.
                """

        user_input = str(input(prompt).strip())
        return user_input

    @staticmethod
    def promptUserForPositiveNumber(prompt: str) -> float:
        """
                Prompts the user for a positive number input.

                Parameters:
                prompt (str): The prompt message displayed to the user.

                Returns:
                float: A positive number entered by the user.
                """

        while True:
            try:
                user_input = float(input(prompt))
                if user_input > 0:
                    return user_input # Return if valid
                else:
                    print("Amount cannot be negative. Try again")
            except ValueError:
                print("Invalid input. Please enter a valid number")

    @staticmethod
    def generateRandomInteger(min: int, max: int) -> int:
        """
                Generates a random integer between min and max, inclusive.

                Parameters:
                min (int): The minimum value for the random integer.
                max (int): The maximum value for the random integer.

                Returns:
                int: A random integer between min and max.
                """
        return randint(min, max)

    def convertFromDollarsToCents(self, amount: float) -> int:
        """
               Converts a dollar amount to cents.

               Parameters:
               amount (float): The amount in dollars.

               Returns:
               int: The amount converted to cents.
               """
        return int(amount * 100)

   
    '''
      Checks if a given string is a number (long)
      This does NOT handle decimals.
      
      YOU DO NOT NEED TO CHANGE THIS METHOD
      THIS IS FREE FOR YOU TO USE AS NEEDED
      
      @param numberToCheck String to check
      @return true if the String is a number, false otherwise
     '''
    @staticmethod
    def isNumeric(numberToCheck) -> bool:
        try:
            if numberToCheck.isdigit():
                return True
            else:
                return False
        except ValueError:
            return False


bank = BankUtility()
