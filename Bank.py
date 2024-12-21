from Account import Account
from BankUtility import BankUtility

class Bank:
   def __init__(self, numOfAccounts=100):
       """
        Initialize the bank with a limit on the number of accounts.
        Defaults to 100 accounts .
        """
       self.__accounts =[]  # List to hold bank accounts.
       self.__numOfAccounts = numOfAccounts # Maximum number of accounts the bank can hold.

       # Getter for __accounts
   def getAccounts(self):
        """
        Returns the list of accounts in the bank.
        """
        return self.__accounts

    # Getter for __numOfAccounts
   def getNumOfAccounts(self):
        """
        Returns the maximum number of accounts allowed in the bank.
        """
        return self.__numOfAccounts
    
   def addAccountToBank(self, account: Account) -> bool:
       """
        Adds an account to the bank if there is space available.
       Returns True if the account was added successfully, otherwise False.
       """

       if len(self.__accounts) >= self.__numOfAccounts:
           print("No more accounts available.")
           return False

   #check if account number already exists
       while True:
           for acc in self.__accounts:
               if acc.getOwnerAccountNumber() == account.getOwnerAccountNumber():
                   # regenerate the account number if a duplicate is found
                   account._accountNumber = BankUtility.generateRandomInteger(10000000, 99999999)
                   break # Exit the inner for loop and regenerate account number

           else:
            #if no duplicate was found, break the while loop
               break

       # add the account to the list of accounts
       self.__accounts.append(account)
       print(f"Account successfully created with account number: {account.getOwnerAccountNumber()}")
       return True

   def removeAccountFromBank(self, account: Account) -> bool:
       """
        Removes an account from the bank.
        Returns True if the account was successfully removed, otherwise False.
        """
       if account in self.__accounts:
           # Remove the account if it exists in the list
           self.__accounts.remove(account)
           return True
       else:
           # Display message if account is not found
            print("Account not Found")
            return False

    
   def findAccount(self, accountNumber: int) -> Account:
        """
        Finds and returns an account based on the account number.
        Returns None if the account is not found.
        """
        for account in self.__accounts:
            if account.getOwnerAccountNumber() == accountNumber:
                return account # Return the account if the account number matches
        return None # Return None if the account was not found

   def isDuplicateSSN(self, ssn: str) -> bool:
       """
       Checks if an SSN is already associated with an existing account.
       Returns True if the SSN is found, otherwise False.
       """
       for account in self.__accounts:
           if account.getOwnerSSN() == ssn:
               return True # Return True if a matching SSN is found
       return False # Return False if no duplicate SSN was found

   def addMonthlyInterest(self, annualInterestRate: float):
       """
        Adds monthly interest to all accounts based on the annual interest rate.
        The interest is compounded monthly.
        """

       monthlyInterestRate = annualInterestRate / 100 / 12  # Convert annual rate to monthly rate (decimal).

       # Loop through all accounts and add interest to each one.
       for account in self.__accounts:
           current_balance = account.getBalance()
           interest = current_balance * monthlyInterestRate
           account.deposit(interest) # Add the interest to the account balance
           # Print the interest added and the new balance
           print(f"Deposited interest: ${interest / 100:.2f} into account number: {account.getOwnerAccountNumber()}, new balance: {account.getBalance() / 100:.2f} ")

   def printAllAccounts(self):
       """
       Prints the details of all accounts in the bank.
       """
       if not self.__accounts:
           # Return message if there are no accounts in the bank
           return "No accounts available."
       else:
           print("=========== Accounts =====================================================================================")
            # Loop through and print each account's details using the toString() method from the Account class
           for account in self.__accounts:
               print(account)  # Use the toString() method from the Account class to display account details.
           print("===============================================================================================================")



# Create a new Bank instance with the default number of accounts (100)
bank = Bank()
