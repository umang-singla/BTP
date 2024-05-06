FROM ubuntu:22.04

#setting up orking directory
WORKDIR /app
RUN apt-get update && apt-get install -y python3 python3-pip
# copy all the files to the container
COPY . .

# install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# define the port number the container should expose
EXPOSE 5000

# run the command
CMD ["flask", "run", "--host", "0.0.0.0"]