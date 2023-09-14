FROM python:3.9.15
WORKDIR /opt
RUN  apt-get update \
  && apt-get install -y unzip \
  && apt-get install -y curl
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN curl https://d2eo22ngex1n9g.cloudfront.net/Documentation/SDK/bedrock-python-sdk.zip --output bedrock-python-sdk.zip
RUN unzip bedrock-python-sdk.zip -d bedrock-python-sdk
RUN pip install ./bedrock-python-sdk/botocore-*-py3-none-any.whl
RUN pip install ./bedrock-python-sdk/boto3-*-py3-none-any.whl
RUN pip install ./bedrock-python-sdk/awscli-*-py3-none-any.whl
COPY *.py /opt/
EXPOSE 8501
ENTRYPOINT ["streamlit", "run"]
CMD ["/opt/showcase_app.py"]
