#################################################################################################################################

prompts = {} #pre-defined prompt templatess, include "{user_input}" to merge input content
inputs = {} #used to merge into prompt templates, merged into the "{user_input}" placeholder
defaults = {} #used for default values in simple examples

#################################################################################################################################
# PROMPTS
#################################################################################################################################

prompts["Reply Template"] = """
{user_input}

Please write a reply to the above text:
"""

#################################################################################################################################

prompts["Summarize"] = """
{user_input}

Please summarize the above content:
"""

#################################################################################################################################

prompts["Sentiment"] = """
{user_input}

Sentiment of the above content (Positive or negative):
"""

#################################################################################################################################

prompts["Recommendation"] = """
{user_input}

Recommended next step based on the above content:
"""

#################################################################################################################################
# INPUTS
#################################################################################################################################

inputs["Complementary Customer Email"] = """
Dear Acme Investments,
I am writing to compliment one of your customer service representatives, Shirley Scarry. I recently had the pleasure of speaking with Shirley regarding my loan. Shirley was extremely helpful and knowledgeable, and went above and beyond to ensure that all of my questions were answered. Shirley also had Robert Herbford join the call, who wasn't quite as helpful. My wife, Clara Bradford, didn't like him at all.
Shirley's professionalism and expertise were greatly appreciated, and I would be happy to recommend Acme Investments to others based on my experience.
Sincerely,

Carson Bradford
"""

#################################################################################################################################

inputs["Ethics Complaint Email"] = """
Dear Acme Investments,
I am writing to bring to your attention a situation that I believe to be unethical on the part of one of your account managers, Roger Longbottom.
I recently met with Roger to discuss my investment portfolio and was deeply concerned to hear that he suggested I invest in a certain stock. When I asked him why he thought this was a good investment, he stated that the stock was currently undervalued and was likely to increase in value in the near future.
However, upon further research, I have discovered that the stock in question has a questionable reputation. It has been the subject of multiple lawsuits and has been found to have engaged in questionable business practices.
I believe Roger was aware of these facts, but failed to disclose them to me. As a result, I feel I was misled into making an unwise investment decision.
I therefore urge you to investigate whether Roger has acted unethically and take appropriate action if necessary.
Yours sincerely,
Carson Bradford
"""

