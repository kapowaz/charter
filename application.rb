require "sinatra"

get "/" do
  @page = {:title => "Charter"}
  erb :index
end