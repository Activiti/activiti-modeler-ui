#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
eval JS_API=true
eval GNU=false
eval EXEC_COMPONENT=true
eval DIFFERENT_JS_API=false
eval AUTO=false

eval libs=( "core"
    "extensions" )

eval paths=(
     $DIR/../projects/ama-sdk/package.json
)

cd `dirname $0`

prefix="@alfresco\/adf-"

show_help() {
    echo "Usage: update-version.sh"
    echo ""
    echo "-sj or -sjsapi  don't update js-api version"
    echo "-vj or -versionjsapi  to use a different version of js-api"
    echo "-v or -version  version to update"
    echo "-alpha update last alpha version of js-api and lib automatically"
    echo "-beta update beta alpha version of js-api and lib automatically"
    echo "-gnu for gnu"
}

skip_js() {
    echo "====== Skip JS-API change version $1 ====="
    JS_API=false
}

last_alpha_mode() {
    echo "====== Auto find last ALPHA version ====="
    VERSION=$(npm view @alfresco/adf-core@alpha version)

    echo "====== version lib ${VERSION} ====="

    DIFFERENT_JS_API=true
    VERSION_JS_API=$(npm view @alfresco/js-api@alpha version)

    echo "====== version js-api ${DIFFERENT_JS_API} ====="
}

last_beta_mode() {
    echo "====== Auto find last BETA version ====="
    VERSION=$(npm view @alfresco/adf-core@beta version)

    echo "====== version lib ${VERSION} ====="

    DIFFERENT_JS_API=true
    VERSION_JS_API=$(npm view @alfresco/js-api@beta version)

    echo "====== version js-api ${DIFFERENT_JS_API} ====="
}

gnu_mode() {
    echo "====== GNU MODE ====="
    GNU=true
}

version_change() {
    echo "====== New version $1 ====="
    VERSION=$1
}

version_js_change() {
    echo "====== Alfresco JS-API version $1 ====="
    VERSION_JS_API=$1
    DIFFERENT_JS_API=true
}

update_component_dependency_version(){
   for (( j=0; j<${libslength}; j++ ));
    do

       echo "====== UPDATE DEPENDENCY VERSION of ${prefix}${libs[$j]} to ~${VERSION}======"

       sed "${sedi[@]}" "s/\"${prefix}${libs[$j]}\": \".*\"/\"${prefix}${libs[$j]}\": \"${VERSION}\"/g" ${1}
       sed "${sedi[@]}" "s/\"${prefix}${libs[$j]}\": \"~.*\"/\"${prefix}${libs[$j]}\": \"~${VERSION}\"/g" ${1}
       sed "${sedi[@]}" "s/\"${prefix}${libs[$j]}\": \"^.*\"/\"${prefix}${libs[$j]}\": \"^${VERSION}\"/g" ${1}

    done
}

update_dependency_for_all() {
    for (( k=0; k<${pathslength}; k++ )); do
        echo "====== UPDATE DEPENDENCY VERSION for  ${paths[$k]} ====="
        update_component_dependency_version ${paths[$k]}
    done
}


update_component_js_version(){
   echo "====== UPDATE DEPENDENCY VERSION of alfresco-js-api in ${1} ======"
   PACKAGETOCHANGE="@alfresco\/js-api"

   sed "${sedi[@]}" "s/\"${PACKAGETOCHANGE}\": \".*\"/\"${PACKAGETOCHANGE}\": \"${2}\"/g"  ${1}
   sed "${sedi[@]}" "s/\"${PACKAGETOCHANGE}\": \"~.*\"/\"${PACKAGETOCHANGE}\": \"${2}\"/g"  ${1}
   sed "${sedi[@]}" "s/\"${PACKAGETOCHANGE}\": \"^.*\"/\"${PACKAGETOCHANGE}\": \"${2}\"/g"  ${1}
}

update_component_js_version_for_all() {
     for (( k=0; k<${pathslength}; k++ )); do
        update_component_js_version ${paths[$k]} ${1}
    done
}

update_main_dependency_version(){
   for (( j=0; j<${libslength}; j++ )); do

       prefix_new="@alfresco/adf-"

       EXACT_VERSION="${prefix_new}${libs[$j]}@${VERSION}"
       echo "====== UPDATE DEPENDENCY VERSION of ${EXACT_VERSION} ======"
       npm i -E ${EXACT_VERSION}
   done
}

update_main_component_js_version(){
   echo "====== UPDATE DEPENDENCY VERSION of @alfresco/js-api in ${1} ======"
   PACKAGETOCHANGE="@alfresco/js-api@${VERSION}"

   npm i -E ${PACKAGETOCHANGE}
}

while [[ $1  == -* ]]; do
    case "$1" in
      -h|--help|-\?) show_help; exit 0;;
      -v|version) version_change $2; shift 2;;
      -sj|sjsapi) skip_js; shift;;
      -vj|versionjsapi)  version_js_change $2; shift 2;;
      -gnu) gnu_mode; shift;;
      -alpha) last_alpha_mode; shift;;
      -beta) last_beta_mode; shift;;
      -*) shift;;
    esac
done

if $GNU; then
 sedi='-i'
else
 sedi=('-i' '')
fi

if [[ "${VERSION}" == "" ]]
then
  echo "Version number required"
  exit 1
fi

projectslength=${#projects[@]}
libslength=${#libs[@]}
pathslength=${#paths[@]}

if $EXEC_COMPONENT == true; then
    echo "====== UPDATE  ======"

    update_main_dependency_version
    update_main_component_js_version

    update_dependency_for_all

     if $JS_API == true; then

      if $DIFFERENT_JS_API == true; then
          update_component_js_version_for_all ${VERSION_JS_API}
      else
          update_component_js_version_for_all ${VERSION}
      fi

     fi
fi
