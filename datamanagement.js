function injectData(vegaSpec, ftRawArticlesArray) {
	
	let articles = [];
	let relations = [];
	
	// mapping of forTEXT node and taxonomy IDs to unique viz IDs
	let ftIdToVizId = new Map();
	let nextVizId = 0;
	
	// generator of unique IDs across nodes and taxonomies
	let vizIdProvider = function(ftId) {
		if (!ftIdToVizId.has(ftId)) {
			ftIdToVizId.set(ftId, nextVizId);
			nextVizId++;
		}
	
		return ftIdToVizId.get(ftId);
	}
	
	// setup parent articles for the forTEXT categories
	let root = {
		'name' : 'forTEXT',
		'id' : vizIdProvider('root')
	}
	
	articles.push(root);

	let ressourcen = {
		'name' : 'Ressourcen',
		'id' : vizIdProvider('Ressourcen'),
		'parent' : ftIdToVizId.get('root')
	}
	
	articles.push(ressourcen);
	
	let routinen = {
		'name' : 'Routinen',
		'id' : vizIdProvider('Routinen'),
		'parent' : ftIdToVizId.get('root')
	}
	
	articles.push(routinen);
	
	let tools = {
		'name' : 'Tools',
		'id' : vizIdProvider('Tools'),
		'parent' : ftIdToVizId.get('root')
	}
	
	articles.push(tools);
	
	// loop forTEXT site data and extract articles and relations between articles
	ftRawArticlesArray.forEach(function(ftArticle) {
		let article = {};
		
		article.name = ftArticle.node_title;
		article.id = vizIdProvider('n'+ftArticle.nid);
		article.url =  'https://fortext.net/' + ftArticle._field_data.nid.entity.path.alias;
		
		// extract and add forTEXT sub categories
		if (ftArticle.field_field_resource_category.length != 0) {
			// add Ressource's sub category if it hasn't been added yet
			if (!ftIdToVizId.has('t'+ftArticle.field_field_resource_category[0].raw.tid)) {
				let resourceCategory = {
					'name' : ftArticle.field_field_resource_category[0].raw.taxonomy_term.name,
					'id' : vizIdProvider('t'+ftArticle.field_field_resource_category[0].raw.tid),
					'parent' : ftIdToVizId.get('Ressourcen')
				}
				articles.push(resourceCategory);
			}
			
			article.parent = vizIdProvider('t'+ftArticle.field_field_resource_category[0].raw.tid);
		}
		else if (ftArticle.field_field_routine_category.length != 0) {
			// add Routine's sub category if it hasn't been added yet
			if (!ftIdToVizId.has('t'+ftArticle.field_field_routine_category[0].raw.tid)) {
				let resourceCategory = {
					'name' : ftArticle.field_field_routine_category[0].raw.taxonomy_term.name,
					'id' : vizIdProvider('t'+ftArticle.field_field_routine_category[0].raw.tid),
					'parent' : ftIdToVizId.get('Routinen')
				}
				articles.push(resourceCategory);
			}
			
			article.parent = vizIdProvider('t'+ftArticle.field_field_routine_category[0].raw.tid);		
		}
		else if (ftArticle.field_field_tool_category.length != 0) {
			// add Tool's sub category if it hasn't been added yet			
			if (!ftIdToVizId.has('t'+ftArticle.field_field_tool_category[0].raw.tid)) {
				let resourceCategory = {
					'name' : ftArticle.field_field_tool_category[0].raw.taxonomy_term.name,
					'id' : vizIdProvider('t'+ftArticle.field_field_tool_category[0].raw.tid),
					'parent' : ftIdToVizId.get('Tools')
				}
				articles.push(resourceCategory);
			}
			
			article.parent = vizIdProvider('t'+ftArticle.field_field_tool_category[0].raw.tid);				
		}
		
		articles.push(article);
		
		// handle relations between articles
		if (!Array.isArray(ftArticle._field_data.nid.entity.field_related_content)) {
			ftArticle._field_data.nid.entity.field_related_content.und.forEach(function(target) {
				if (ftIdToVizId.has('n'+target.nid)) { //there is some related content that does not appear as an article
					let relation = {
						'source' : vizIdProvider('n'+ftArticle.nid),
						'target' : vizIdProvider('n'+target.nid)
					}
					
					relations.push(relation);
				}
			});
		}
	});
	
	console.log(articles);
	console.log(relations);
	
	let treeData = vegaSpec.data.find(function(dataSpec) {
		return dataSpec.name === 'tree';
	});
	
	delete treeData.url;
	treeData.values = articles;
	
	let relationData = vegaSpec.data.find(function(dataSpec) {
		return dataSpec.name === 'relations';
	});
	
	delete relationData.url;
	relationData.values = relations;
}